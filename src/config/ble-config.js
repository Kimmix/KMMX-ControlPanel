/**
 * BLE Configuration
 * UUIDs and settings for Bluetooth Low Energy communication
 */

export const bleUUID = {
  service: "c1449275-bf34-40ab-979d-e34a1fdbb129",
  characteristic: {
    display: "9fdfd124-966b-44f7-8331-778c4d1512fc",
    eyeState: "49a36bb2-1c66-4e5c-8ff3-28e55a64beb3",
    viseme: "493d06f3-0fa0-4a90-88f1-ebaed0da9b80",
    mouthState: "f6a7b8c9-d0e1-4f5a-b1c2-3d4e5f6a7b8c",
    hornLedBrightness: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    cheekPanelBrightness: "b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e",
    cheekBgColor: "c3d4e5f6-a7b8-4c5d-9e0f-1a2b3c4d5e6f",
    cheekFadeColor: "d4e5f6a7-b8c9-4d5e-9f0a-1b2c3d4e5f6a",
    reboot: "e5f6a7b8-c9d0-4e5f-a0b1-2c3d4e5f6a7b",
    displayColorMode: "f5a6b7c8-d9e0-4f5a-b0c1-2d3e4f5a6b7c",
    displayEffectColor1: "a6b7c8d9-e0f1-4a5b-c1d2-3e4f5a6b7c8d",
    displayEffectColor2: "b7c8d9e0-f1a2-4b5c-d2e3-4f5a6b7c8d9e",
    displayEffectOption1: "c7d8e9f0-a1b2-4c5d-e2f3-4a5b6c7d8e9f",
    displayEffectOption2: "e7f8a9b0-c1d2-4e5f-a2b3-4c5d6e7f8a9b",
    displayEffectOption3: "f7a8b9c0-d1e2-4f5a-b2c3-4d5e6f7a8b9c",
    glitchTrigger: "a1a2a3a4-b1b2-4c1c-d1d2-e1e2e3e4e5f1",
    motionEnableFlags: "a1a2a3a4-b1b2-4c1c-d1d2-e1e2e3e4e5f2",
    tapSensitivity: "a1a2a3a4-b1b2-4c1c-d1d2-e1e2e3e4e5f3",
    glitchIntensity: "a1a2a3a4-b1b2-4c1c-d1d2-e1e2e3e4e5f4",
    fanSpeed: "f1f2f3f4-a1a2-4b1b-c1c2-d1d2d3d4d5f1",
    // Viseme Advanced Parameters
    visemeEnvelopeAttack: "d1e2f3a4-b5c6-47d8-9e0f-1a2b3c4d5e6f",
    visemeEnvelopeRelease: "d2e3f4a5-b6c7-48d9-9f0a-1b2c3d4e5f6a",
    visemeNoiseGateMultiplier: "d4e5f6a7-b8c9-4adb-a1b2-3d4e5f6a7b8c",
    visemeNoiseFloorMin: "d6e7f8a9-bacb-4cdd-a3b4-5f6a7b8c9d0e",
    visemeAHScale: "d9eafbac-bdce-4fe0-a6b7-8c9d0e1f2a3b",
    visemeEEScale: "dafbfcad-becf-4ae1-a7b8-9d0e1f2a3b4c",
    visemeOHScale: "dbfcfdae-bfd0-4be2-a8b9-0e1f2a3b4c5d",
    visemeOOScale: "dcfdfebf-c0d1-4ce3-a9ba-1f2a3b4c5d6e",
    visemeTHScale: "ddfeafc0-c1d2-4de4-aabb-2a3b4c5d6e7f",
    visemeLoudnessExponent: "deafc0d1-c2d3-4ef5-abcc-3b4c5d6e7f80",
    visemeLoudnessSmoothing: "dfb0c1d2-c3d4-4fa6-abdd-4c5d6e7f8091",
    visemeLoudnessMax: "e0c1d2e3-d4e5-40b7-acee-5d6e7f8091a2",
    visemeLoudnessMidBoost: "e1d2e3f4-e5f6-41c8-adff-6e7f8091a2b3"
  }
};

// Make bleUUID available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.bleUUID = bleUUID;
}
