// The device owns accepted settings; local slider edits are only a pending preview.
let visemeDraft = null, visemeEditTimer = null;
const visemeElement = id => document.getElementById(id);
function renderVisemeTuning(client) {
  const s = client.status, active = VisemeV2.busy(s);
  const editing = Boolean(visemeEditTimer) || client.pending;
  const shown = editing && visemeDraft ? visemeDraft : client.confirmed;
  if (!editing) visemeDraft = client.confirmed && { ...client.confirmed };
  for (const id of ['noiseRejection', 'mouthSize', 'visemeResponse']) visemeElement(id).disabled = !client.supported || active;
  visemeElement('calibrateRoom').disabled = !client.supported || active || editing || s?.mic !== 0;
  visemeElement('cancelCalibration').disabled = !client.supported || !active || client.pending;
  if (shown) {
    visemeElement('noiseRejection').value = VisemeV2.toSlider(shown.threshold, 1, 1000);
    visemeElement('mouthSize').value = VisemeV2.toSlider(shown.gain, 0.25, 4);
    visemeElement('noiseRejectionValue').textContent = shown.threshold.toFixed(1);
    visemeElement('mouthSizeValue').textContent = `${shown.gain.toFixed(2)}×`;
    visemeElement('visemeResponse').value = shown.response;
  }
  visemeElement('visemeConfirmed').textContent = client.confirmed
    ? `Accepted: threshold ${client.confirmed.threshold.toFixed(1)}, mouth size ${client.confirmed.gain.toFixed(2)}×` : '';
  let message = editing ? 'Pending changes…' : 'Settings applied';
  if (s) {
    const phases = ['Ready', `Stay quiet — ${Math.max(0, Math.ceil(2 * (1 - s.progress / 100)))}s`, `Measuring — ${s.progress}%`, 'Room calibrated', 'Calibration failed', 'Calibration cancelled'];
    const errors = ['', 'Invalid request', 'Calibration is busy', 'Audio unavailable', 'Clipping: lower the sound level and retry', 'No microphone signal', 'Room too loud: reduce noise and retry'];
    message = `${editing ? 'Pending changes…' : s.accepted !== s.applied ? 'Waiting for audio…' : 'Settings applied'} · ${phases[s.calibration]}`;
    if (s.mic) message += ' · Microphone error';
    if (s.result) message += ` · ${errors[s.result]}`;
    const threshold = client.confirmed?.threshold ?? 13;
    const maximum = Math.max(100, threshold * 1.25);
    visemeElement('visemeMeterFill').style.width = `${Math.min(100, s.rms / maximum * 100)}%`;
    visemeElement('visemeMeterGate').style.left = `${Math.min(100, threshold / maximum * 100)}%`;
    visemeElement('visemeMeter').setAttribute('aria-valuenow', s.rms.toFixed(1));
    visemeElement('visemeMeter').setAttribute('aria-valuemax', maximum);
    visemeElement('visemeReading').textContent = `Input ${s.rms.toFixed(1)} · gate ${s.gate ? 'open' : 'closed'} · ${['AH', 'EE', 'OH', 'OO', 'TH'][s.shape]} ${s.opening}/60`;
  }
  visemeElement('visemeFeedback').textContent = client.error || message;
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
  if (event.target.id === 'noiseRejection') visemeDraft.threshold = VisemeV2.fromSlider(Number(event.target.value), 1, 1000);
  if (event.target.id === 'mouthSize') visemeDraft.gain = VisemeV2.fromSlider(Number(event.target.value), 0.25, 4);
  if (event.target.id === 'visemeResponse') visemeDraft.response = Number(event.target.value);
  if (!visemeEditTimer) visemeEditTimer = setTimeout(sendVisemeEdit, 100);
  visemeClient.error = ''; renderVisemeTuning(visemeClient);
}
for (const id of ['noiseRejection', 'mouthSize', 'visemeResponse']) {
  visemeElement(id).addEventListener('input', editViseme);
  visemeElement(id).addEventListener('change', event => { editViseme(event); sendVisemeEdit(); });
}
visemeElement('calibrateRoom').addEventListener('click', () => visemeClient.calibrate(1));
visemeElement('cancelCalibration').addEventListener('click', () => visemeClient.calibrate(2));
window.disconnectViseme = () => {
  clearTimeout(visemeEditTimer); visemeEditTimer = null; visemeDraft = null;
  visemeClient.disconnect();
};
