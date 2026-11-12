// The device owns accepted settings; local slider edits are only a pending preview.
let visemeDraft = null, visemeEditTimer = null;
const visemeElement = id => document.getElementById(id);
const responseButtons = [0, 1, 2].map(value => visemeElement(`visemeResponse${value}`));
let inputDisplay = null, inputTarget = 0, inputMaximum = 100, inputFrame = null, inputTime = null;
let inputSamples = [];
function smoothLevel(value, target, elapsed) {
  const duration = target > value ? 25 : 90;
  value += (target - value) * (1 - Math.exp(-elapsed / duration));
  if (Math.abs(target - value) < 0.05) value = target;
  return value;
}
function animateVisemeInput(now) {
  const elapsed = inputTime === null ? 0 : Math.max(0, now - inputTime);
  inputTime = now;
  inputDisplay = smoothLevel(inputDisplay, inputTarget, elapsed);
  visemeElement('visemeMeterFill').style.width = `${Math.min(100, inputDisplay / inputMaximum * 100)}%`;
  visemeElement('visemeMeter').setAttribute('aria-valuenow', inputDisplay.toFixed(1));
  visemeElement('visemeReading').textContent = inputDisplay.toFixed(1);
  inputFrame = inputDisplay === inputTarget ? null : requestAnimationFrame(animateVisemeInput);
}
function renderVisemeTuning(client) {
  const s = client.status, active = VisemeV2.busy(s);
  const editing = Boolean(visemeEditTimer) || client.pending;
  window.setVisemeWriting?.(client.supported && (editing || Boolean(s && s.accepted !== s.applied)), client.error);
  const shown = editing && visemeDraft ? visemeDraft : client.confirmed;
  if (!editing) visemeDraft = client.confirmed && { ...client.confirmed };
  for (const id of ['noiseRejection', 'mouthSize']) visemeElement(id).disabled = !client.supported || active;
  visemeElement('calibrateRoom').disabled = !client.supported || active || editing || s?.mic !== 0;
  visemeElement('cancelCalibration').disabled = !client.supported || !active || client.pending;
  visemeElement('cancelCalibration').hidden = !active;
  visemeElement('startCalibration').disabled = !client.supported || active || editing || s?.mic !== 0;
  visemeElement('closeCalibration').disabled = active;
  responseButtons.forEach((button, value) => {
    button.disabled = !client.supported || active;
    button.classList.toggle('active', shown?.response === value);
    button.setAttribute('aria-pressed', String(shown?.response === value));
  });
  if (shown) {
    visemeElement('noiseRejection').value = VisemeV2.toSlider(shown.threshold, 50, 1000);
    visemeElement('mouthSize').value = VisemeV2.toSlider(shown.gain, 0.25, 4);
    visemeElement('noiseRejectionValue').textContent = shown.threshold.toFixed(1);
    visemeElement('mouthSizeValue').textContent = `${shown.gain.toFixed(2)}\u00d7`;

  }
  for (const id of ['noiseRejection', 'mouthSize']) {
    const slider = visemeElement(id);
    slider.style.backgroundImage = `linear-gradient(to right, white ${slider.value}%, rgba(255, 255, 255, 0.1) ${slider.value}%)`;
  }
  let message = editing ? 'Pending changes\u2026' : 'Settings applied';
  if (s) {
    const phases = ['Ready', `Stay quiet \u2014 ${Math.max(0, Math.ceil(2 * (1 - s.progress / 100)))}s`, `Measuring \u2014 ${s.progress}%`, 'Room noise settings ready', 'Could not measure room noise', 'Room noise measurement cancelled'];
    const errors = ['', 'Invalid request', 'Already measuring room noise', 'Audio unavailable', 'Sound is too loud. Lower the volume and try again.', 'No microphone signal', 'The room is too loud. Find a quieter spot and try again.'];
    message = active || s.calibration >= 3 ? phases[s.calibration] : editing ? 'Pending changes…' : s.accepted !== s.applied ? 'Waiting for audio…' : 'Ready';
    if (s.mic) message += ' \u00b7 Microphone error';
    if (s.result) message += ` \u00b7 ${errors[s.result]}`;
    const threshold = shown?.threshold ?? 13;
    const maximum = Math.max(100, threshold * 1.25);
    const now = performance.now();
    inputSamples = inputSamples.filter(sample => now - sample.time < 3000);
    inputSamples.push({ time: now, value: s.rms });
    const values = inputSamples.map(sample => sample.value);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    visemeElement('visemeRange').textContent = `Min ${Math.min(...values).toFixed(1)} / Avg ${average.toFixed(1)} / Max ${Math.max(...values).toFixed(1)}`;
    inputTarget = s.rms;
    inputMaximum = maximum;
    if (inputDisplay === null) inputDisplay = inputTarget;
    if (inputFrame === null) {
      inputTime = performance.now();
      animateVisemeInput(inputTime);
    }
    visemeElement('visemeMeterGate').style.left = `${Math.min(100, threshold / maximum * 100)}%`;
    visemeElement('visemeMeter').setAttribute('aria-valuemax', maximum);
  }
  if (!s) {
    inputSamples = [];
    visemeElement('visemeRange').textContent = 'Min -- / Avg -- / Max --';
    if (inputFrame !== null) cancelAnimationFrame(inputFrame);
    inputFrame = null; inputDisplay = null; inputTime = null;
    visemeElement('visemeReading').textContent = 'Unavailable';
    visemeElement('visemeMeterFill').style.width = '0%';
    visemeElement('visemeMeter').setAttribute('aria-valuenow', '0');
  }
  const feedback = client.error || (!client.supported ? 'Connect to adjust lip sync.' : message === 'Ready' ? '' : message);
  visemeElement('calibrationFeedback').textContent = feedback;
  const panelFeedback = !client.error && (editing || (s && s.accepted !== s.applied) || s?.calibration > 0) ? '' : feedback;
  visemeElement('visemeFeedback').textContent = panelFeedback;
  visemeElement('visemeFeedback').hidden = !panelFeedback;
}
const scorePanel = visemeElement('visemeScores');
const tracks = [...scorePanel.querySelectorAll('.score-track')];
const historyStrip = visemeElement('shapeHistory');
let weights = null, latestStatus = null, historyFrame;
let samples = [];
function drawHistory() {
  const now = performance.now(), start = now - 2000;
  samples = samples.filter(sample => sample.end > start);
  const runs = [];
  for (const sample of samples) {
    const prev = runs[runs.length - 1];
    if (sample.shape === null) continue;
    if (prev && prev.shape === sample.shape && prev.end === sample.at) prev.end = sample.end;
    else runs.push({ ...sample });
  }
  while (historyStrip.childElementCount > runs.length) historyStrip.lastElementChild.remove();
  const stripWidth = historyStrip.clientWidth;
  runs.forEach((run, i) => {
    const segment = historyStrip.children[i] || historyStrip.appendChild(document.createElement('span'));
    const left = Math.max(run.at, start);
    const width = Math.max(0, Math.min(run.end, now) - left) / 2000;
    segment.style.left = (left - start) / 20 + '%';
    segment.style.width = width * 100 + '%';
    const label = width * stripWidth >= 20 ? run.shape : '';
    if (segment.textContent !== label) segment.textContent = label;
  });
  historyStrip.setAttribute('aria-label', runs.map(r => r.shape).join(', ') || 'No recent shapes');
  historyFrame = samples.length ? requestAnimationFrame(drawHistory) : null;
}
const scoreBarMaxPercent = 50;
const barWidth = percent => Math.min(100, percent * 100 / scoreBarMaxPercent);
function renderMix() {
  scorePanel.hidden = !weights;
  visemeElement('visemeMeterGate').classList.toggle('open', Boolean(weights && latestStatus?.gate));
  if (!weights) return;
  const sorted = [...weights].sort((a,b) => b-a);
  tracks.forEach((track,i) => {
    const value = weights[i];
    track.dataset.rank = value && value === sorted[0] ? 1 : value && value === sorted[1] ? 2 : 0;
    track.parentElement.classList.toggle('active', Boolean(latestStatus?.opening && latestStatus.shape === i));
    const tick = track.lastElementChild;
    tick.hidden = !(latestStatus?.gate && latestStatus.shape !== i && value === sorted[0] && value > sorted[1] && sorted[1]);
    tick.style.left = barWidth(sorted[1] * 115 / 255) + '%';
  });
}
let displayedScores = null, scoreFrame = null, scoreTime = 0;
function animateScores(now) {
  scoreFrame = null;
  let moving = false;
  tracks.forEach((track, i) => {
    const target = weights[i] * 100 / 255;
    const pct = smoothLevel(displayedScores[i], target, now - scoreTime);
    displayedScores[i] = pct;
    if (pct !== target) moving = true;
    track.firstElementChild.style.width = barWidth(pct) + '%';
    track.setAttribute('aria-valuenow', Math.round(pct));
  });
  scoreTime = now;
  if (moving) scoreFrame = requestAnimationFrame(animateScores);
}
function renderVisemeScores(bytes) {
  weights = bytes;
  if (bytes && scoreFrame === null) {
    displayedScores ??= bytes.map(value => value * 100 / 255);
    scoreTime = performance.now();
    animateScores(scoreTime);
  } else if (!bytes) {
    cancelAnimationFrame(scoreFrame);
    scoreFrame = null;
    displayedScores = null;
  }
  if (!bytes) { cancelAnimationFrame(historyFrame); samples = []; drawHistory(); }
  renderMix();
}
const scaleInputs = [...scorePanel.querySelectorAll('.viseme-scale input')];
const editScales = visemeElement('editVisemeScales');
let editingScales = false;
editScales.addEventListener('click', event => {
  event.preventDefault();
  editingScales = !editingScales;
  renderStatus(visemeClient);
});
const resetScales = visemeElement('resetVisemeScales');
scaleInputs.forEach((input, i) => input.addEventListener('input', () => {
  const values = [...visemeClient.scales];
  values[i] = VisemeV2.scaleFromSlider(input.valueAsNumber);
  visemeClient.submitScales(values);
}));
scaleInputs.forEach((input, i) => input.addEventListener('keydown', event => {
  const direction = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[event.key];
  if (!direction || !visemeClient.scales) return;
  event.preventDefault();
  const values = [...visemeClient.scales];
  values[i] = Math.max(0, Math.min(500, values[i] + direction));
  visemeClient.submitScales(values);
}));
resetScales.addEventListener('click', event => { event.preventDefault(); visemeClient.submitScales(null); });
function renderStatus(client) {
  if (!client.scales) editingScales = false;
  editScales.hidden = !client.scales;
  editScales.setAttribute('aria-pressed', String(editingScales));
  scaleInputs.forEach((input, i) => {
    input.parentElement.hidden = !editingScales;
    input.disabled = !client.scales || client.resettingScales;
    if (client.scales) {
      const value = (client.scales[i] / 100).toFixed(2);
      const percent = VisemeV2.scaleToSlider(client.scales[i]);
      input.value = percent;
      input.style.setProperty('--fill', percent + '%');
      input.setAttribute('aria-valuetext', value + ' times');
      input.nextElementSibling.textContent = value + '\u00d7';
    }
  });
  resetScales.hidden = !client.scales;
  resetScales.disabled = client.resettingScales;
  visemeElement('visemeScaleError').textContent = client.scaleError;
  visemeElement('visemeScaleError').hidden = !client.scaleError;
  const status = client.supported ? client.status : null;
  if (status !== latestStatus && status && weights) {
    const at = performance.now();
    const prev = samples[samples.length - 1];
    if (prev) prev.end = Math.min(prev.end, at);
    samples.push({ at, end: at + 150, shape: status.opening ? ['AH','EE','OH','OO','TH'][status.shape] : null });
    if (historyFrame == null) drawHistory();
  }
  latestStatus = status;
  renderMix();
  renderVisemeTuning(client);
}
const visemeClient = new VisemeV2.Client(bleManager, renderStatus, renderVisemeScores);
window.visemeClient = visemeClient;
function sendVisemeEdit() {
  clearTimeout(visemeEditTimer); visemeEditTimer = null;
  if (visemeDraft && visemeClient.supported) visemeClient.submit({ ...visemeDraft });
}
function editViseme(event) {
  if (!visemeClient.supported || VisemeV2.busy(visemeClient.status)) return;
  visemeDraft = { ...(visemeDraft || visemeClient.confirmed) };
  if (event.target.id === 'noiseRejection') visemeDraft.threshold = VisemeV2.fromSlider(Number(event.target.value), 50, 1000);
  if (event.target.id === 'mouthSize') visemeDraft.gain = VisemeV2.fromSlider(Number(event.target.value), 0.25, 4);
  if (event.target.id === 'visemeResponse') {
    visemeDraft.response = Number(event.target.value);
  }
  if (!visemeEditTimer) visemeEditTimer = setTimeout(sendVisemeEdit, 100);
  visemeClient.error = ''; renderVisemeTuning(visemeClient);
}
for (const id of ['noiseRejection', 'mouthSize']) {
  visemeElement(id).addEventListener('input', editViseme);
  visemeElement(id).addEventListener('change', event => { editViseme(event); sendVisemeEdit(); });
}
responseButtons.forEach(button => button.addEventListener('click', () => {
  editViseme({ target: { id: 'visemeResponse', value: button.value } });
  sendVisemeEdit();
}));
visemeElement('calibrateRoom').addEventListener('click', () => {
  visemeElement('calibrationFeedback').textContent = '';
  visemeElement('calibrationDialog').showModal();
});
visemeElement('startCalibration').addEventListener('click', () => visemeClient.calibrate(1));
visemeElement('closeCalibration').addEventListener('click', () => visemeElement('calibrationDialog').close());
visemeElement('calibrationDialog').addEventListener('cancel', event => {
  if (VisemeV2.busy(visemeClient.status)) event.preventDefault();
});
visemeElement('cancelCalibration').addEventListener('click', () => visemeClient.calibrate(2));
window.disconnectViseme = () => {
  clearTimeout(visemeEditTimer); visemeEditTimer = null; visemeDraft = null;
  visemeClient.disconnect();
};
