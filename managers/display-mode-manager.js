/**
 * DisplayModeManager - Manages display mode state and UI updates
 * Consolidates duplicate logic from setDisplayColorMode() and setDisplayColorModeValue()
 *
 * Display Modes:
 * 0 - Gradient: Shows Color1, Color2, and gradient preview
 * 1 - Spiral Vortex: Rainbow effect (no controls)
 * 2 - Plasma Effect: Rainbow effect (no controls)
 * 3 - Radial Pulse: Rainbow effect (no controls)
 * 4 - Dual Spiral: Shows Color1, Color2, Thickness, Speed, Direction
 * 5 - Dual Circle: Shows Color1, Color2, Thickness, Speed, Direction
 */
class DisplayModeManager {
    constructor(config) {
        // Mode button elements
        this.modeButtons = config.modeButtons || [];

        // Color control elements
        this.customGradientColors = config.customGradientColors;
        this.gradientBottomColorContainer = config.gradientBottomColorContainer;
        this.gradientTopColorLabel = config.gradientTopColorLabel;
        this.gradientBottomColorLabel = config.gradientBottomColorLabel;

        // Preview elements
        this.gradientPreview = config.gradientPreview;
        this.gradientPreviewTitle = config.gradientPreviewTitle;
        this.gradientPreviewContainer = config.gradientPreviewContainer;
        this.gradientTopColorPicker = config.gradientTopColorPicker;
        this.gradientBottomColorPicker = config.gradientBottomColorPicker;

        // Option control elements
        this.dualSpiralThicknessControl = config.dualSpiralThicknessControl;
        this.dualCircleThicknessControl = config.dualCircleThicknessControl;
        this.directionInvertControl = config.directionInvertControl;

        // Label elements for option controls
        this.option1Label = document.getElementById('effectOption1Label');
        this.option2Label = document.getElementById('effectOption2Label');

        // Mode configuration
        this.modeConfig = {
            0: { // Gradient
                name: 'Gradient',
                showColorControls: true,
                showColor2: true,
                showPreview: true,
                showOptions: false,
                topColorLabel: 'Top Gradient Color',
                bottomColorLabel: 'Bottom Gradient Color',
                previewType: 'gradient'
            },
            1: { // Spiral Vortex
                name: 'Spiral Vortex',
                showColorControls: false,
                showColor2: false,
                showPreview: false,
                showOptions: false
            },
            2: { // Plasma Effect
                name: 'Plasma Effect',
                showColorControls: false,
                showColor2: false,
                showPreview: false,
                showOptions: false
            },
            3: { // Radial Pulse
                name: 'Radial Pulse',
                showColorControls: false,
                showColor2: false,
                showPreview: false,
                showOptions: false
            },
            4: { // Dual Spiral
                name: 'Dual Spiral',
                showColorControls: true,
                showColor2: true,
                showPreview: false,
                showOptions: true,
                topColorLabel: 'Primary Spiral Color',
                bottomColorLabel: 'Secondary Spiral Color',
                option1Label: 'Thickness',
                option2Label: 'Speed'
            },
            5: { // Dual Circle
                name: 'Dual Circle',
                showColorControls: true,
                showColor2: true,
                showPreview: false,
                showOptions: true,
                topColorLabel: 'Primary Circle Color',
                bottomColorLabel: 'Secondary Circle Color',
                option1Label: 'Thickness',
                option2Label: 'Speed'
            }
        };
    }

    /**
     * Update UI for the given mode
     * @param {number} mode - Display mode index (0-5)
     */
    updateUI(mode) {
        // Update button active states
        this.updateButtonStates(mode);

        // Update control visibility
        this.updateControlVisibility(mode);

        // Update labels
        this.updateLabels(mode);

        // Update preview
        this.updatePreview(mode);
    }

    /**
     * Update active state of mode buttons
     */
    updateButtonStates(mode) {
        // Remove active class from all mode buttons
        this.modeButtons.forEach(btn => {
            if (btn) btn.classList.remove('active');
        });

        // Add active class to selected mode button
        if (mode >= 0 && mode < this.modeButtons.length && this.modeButtons[mode]) {
            this.modeButtons[mode].classList.add('active');
        }
    }

    /**
     * Show/hide controls based on mode configuration
     */
    updateControlVisibility(mode) {
        const config = this.modeConfig[mode];
        if (!config) return;

        // Show/hide main color controls container
        if (this.customGradientColors) {
            this.customGradientColors.style.display = config.showColorControls ? 'block' : 'none';
        }

        // Show/hide second color picker (Color2)
        if (this.gradientBottomColorContainer) {
            this.gradientBottomColorContainer.style.display = config.showColor2 ? 'block' : 'none';
        }

        // Show/hide gradient preview
        if (this.gradientPreviewContainer) {
            this.gradientPreviewContainer.style.display = config.showPreview ? 'block' : 'none';
        }

        // Show/hide option controls (Thickness, Speed, Direction) - for modes 4 and 5
        const showOptions = config.showOptions;
        if (this.dualSpiralThicknessControl) {
            this.dualSpiralThicknessControl.style.display = showOptions ? 'block' : 'none';
        }
        if (this.dualCircleThicknessControl) {
            this.dualCircleThicknessControl.style.display = showOptions ? 'block' : 'none';
        }
        if (this.directionInvertControl) {
            this.directionInvertControl.style.display = showOptions ? 'block' : 'none';
        }
    }

    /**
     * Update color picker and option control labels
     */
    updateLabels(mode) {
        const config = this.modeConfig[mode];
        if (!config) return;

        // Update color picker labels
        if (config.topColorLabel && this.gradientTopColorLabel) {
            this.gradientTopColorLabel.textContent = config.topColorLabel;
        }
        if (config.bottomColorLabel && this.gradientBottomColorLabel) {
            this.gradientBottomColorLabel.textContent = config.bottomColorLabel;
        }

        // Update option control labels (for modes 4 and 5)
        if (config.option1Label && this.option1Label) {
            this.option1Label.textContent = config.option1Label;
        }
        if (config.option2Label && this.option2Label) {
            this.option2Label.textContent = config.option2Label;
        }
    }

    /**
     * Update preview display based on mode
     */
    updatePreview(mode) {
        const config = this.modeConfig[mode];
        if (!config || !this.gradientPreview) return;

        // Only update preview for modes that show it
        if (!config.showPreview) return;

        const topColor = this.gradientTopColorPicker?.value || '#FFA393';
        const bottomColor = this.gradientBottomColorPicker?.value || '#FF2B5B';

        if (mode === 0) {
            // Gradient mode - linear gradient
            this.gradientPreview.style.background = `linear-gradient(to bottom, ${topColor}, ${bottomColor})`;
            if (this.gradientPreviewTitle) {
                this.gradientPreviewTitle.textContent = 'Preview';
            }
        } else if (mode === 4) {
            // Dual Spiral mode - conic gradient
            this.gradientPreview.style.background = `conic-gradient(from 45deg, ${topColor} 0deg 45deg, ${bottomColor} 45deg 90deg, ${topColor} 90deg 135deg, ${bottomColor} 135deg 180deg, ${topColor} 180deg 225deg, ${bottomColor} 225deg 270deg, ${topColor} 270deg 315deg, ${bottomColor} 315deg 360deg)`;
            if (this.gradientPreviewTitle) {
                this.gradientPreviewTitle.textContent = 'DualSpiral Preview';
            }
        }
    }

    /**
     * Get current active mode by checking button states
     * @returns {number} Current mode index, or -1 if none active
     */
    getCurrentMode() {
        return this.modeButtons.findIndex(btn => btn && btn.classList.contains('active'));
    }

    /**
     * Get mode name for a given mode index
     * @param {number} mode - Mode index
     * @returns {string} Mode name
     */
    getModeName(mode) {
        return this.modeConfig[mode]?.name || 'Unknown';
    }
}

// Make DisplayModeManager available globally
window.DisplayModeManager = DisplayModeManager;
