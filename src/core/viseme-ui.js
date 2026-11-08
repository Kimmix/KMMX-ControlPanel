// The device owns accepted settings; local slider edits are only a pending preview.
let visemeDraft = null, visemeEditTimer = null;
const visemeElement = id => document.getElementById(id);
const responseButtons = [0, 1, 2].map(value => visemeElement(`visemeResponse${value}`));
let inputDisplay = null, inputTarget = 0, inputMaximum = 100, inputFrame = null, inputTime = null;
let inputSamples = [];
function animateVisemeInput(now) {
  const elapsed = inputTime === null ? 0 : Math.max(0, now - inputTime);
  inputTime = now;
  const duration = inputTarget > inputDisplay ? 25 : 90;
  inputDisplay += (inputTarget - inputDisplay) * (1 - Math.exp(-elapsed / duration));
  if (Math.abs(inputTarget - inputDisplay) < 0.05) inputDisplay = inputTarget;
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
  let message = editing ? 'Pending changes\u2026' : 'Settings applied';
  if (s) {
    const phases = ['Ready', `Stay quiet \u2014 ${Math.max(0, Math.ceil(2 * (1 - s.progress / 100)))}s`, `Measuring \u2014 ${s.progress}%`, 'Room calibrated', 'Calibration failed', 'Calibration cancelled'];
    const errors = ['', 'Invalid request', 'Calibration is busy', 'Audio unavailable', 'Clipping: lower the sound level and retry', 'No microphone signal', 'Room too loud: reduce noise and retry'];
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
  const feedback = client.error || (!client.supported ? 'Connect to tune lip sync.' : message === 'Ready' ? '' : message);
  visemeElement('calibrationFeedback').textContent = feedback;
  const panelFeedback = !client.error && (editing || (s && s.accepted !== s.applied) || s?.calibration > 0) ? '' : feedback;
  visemeElement('visemeFeedback').textContent = panelFeedback;
  visemeElement('visemeFeedback').hidden = !panelFeedback;
}
const visemeClient = new VisemeV2.Client(bleManager, renderVisemeTuning);
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
