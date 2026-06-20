/**
 * Reusable Slider Component
 * Supports both dot-based and gradient-based sliders
 */
class Slider {
  /**
   * @param {Object} config - Slider configuration
   * @param {string} config.sliderId - ID of the slider input element
   * @param {string} config.dotsContainerId - ID of the dots container (for dot-based sliders)
   * @param {string} config.valueDisplayId - ID of the element to display the current value
   * @param {string} config.type - 'dots' or 'gradient'
   * @param {number} config.maxValue - Maximum value (default: 100)
   * @param {Function} config.onChange - Callback when value changes (receives value)
   * @param {boolean} config.vibrate - Enable haptic feedback (default: true)
   * @param {boolean} config.convertToPercentage - Convert value to percentage for display (default: false)
   */
  constructor(config) {
    this.sliderId = config.sliderId;
    this.dotsContainerId = config.dotsContainerId;
    this.valueDisplayId = config.valueDisplayId;
    this.type = config.type || 'dots';
    this.maxValue = config.maxValue || 100;
    this.onChange = config.onChange;
    this.vibrate = config.vibrate !== false;
    this.convertToPercentage = config.convertToPercentage || false;
    this.valueSuffix = config.valueSuffix || '';
    
    this.sliderElement = document.getElementById(this.sliderId);
    this.dotsContainer = this.dotsContainerId ? document.getElementById(this.dotsContainerId) : null;
    this.valueDisplay = this.valueDisplayId ? document.getElementById(this.valueDisplayId) : null;
    
    this.prevNumOfWhiteDots = 0;
    
    this.init();
  }

  init() {
    if (!this.sliderElement) {
      console.error(`Slider element with ID "${this.sliderId}" not found`);
      return;
    }

    if (this.type === 'dots' && this.dotsContainer) {
      this.renderTotalDots();
      // Add resize listener for dots
      window.addEventListener('resize', () => {
        this.renderTotalDots();
        this.renderValue(this.sliderElement.value, true);
      });
    }

    // Add input event listener
    this.sliderElement.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      this.renderValue(value);
      
      if (this.onChange) {
        this.onChange(value);
      }
      
      if (this.vibrate && typeof vibrateDevice === 'function') {
        vibrateDevice();
      }
    });

    // Render initial value
    const initialValue = parseInt(this.sliderElement.value) || 0;
    this.renderValue(initialValue, true);
  }

  /**
   * Create dots based on screen width
   */
  createDots(numDots) {
    if (!this.dotsContainer) return;
    
    for (let i = 0; i < numDots; i++) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      this.dotsContainer.appendChild(dot);
    }
  }

  /**
   * Render total number of dots based on screen width
   */
  renderTotalDots() {
    if (!this.dotsContainer) return;
    
    const deviceWidth = window.innerWidth;
    const numDots = Math.floor(deviceWidth / 30);
    this.dotsContainer.innerHTML = '';
    this.createDots(numDots);
  }

  /**
   * Set slider value programmatically (e.g., from BLE)
   * @param {number} value - The value to set
   */
  setValue(value) {
    if (this.sliderElement) {
      this.sliderElement.value = value;
      this.renderValue(value, true);
    }
  }

  /**
   * Render the slider value (dots or gradient)
   * @param {number} value - Current slider value
   * @param {boolean} firstTime - Skip vibration on first render
   */
  renderValue(value, firstTime = false) {
    if (this.type === 'dots') {
      this.renderDots(value, firstTime);
    } else if (this.type === 'gradient') {
      this.renderGradient(value);
    }

    // Update value display
    if (this.valueDisplay) {
      let displayValue = value;
      if (this.convertToPercentage) {
        displayValue = Math.round((value / this.maxValue) * 100);
      }
      this.valueDisplay.textContent = `${displayValue}${this.valueSuffix}`;
    }
  }

  /**
   * Render dots for dot-based sliders
   */
  renderDots(value, firstTime = false) {
    if (!this.dotsContainer) return;
    
    const dots = this.dotsContainer.querySelectorAll('.dot');
    const numOfWhiteDots = Math.ceil((value / this.maxValue) * dots.length);
    
    // Vibrate only when number of white dots changes (and not on first render)
    if ((numOfWhiteDots !== this.prevNumOfWhiteDots) && !firstTime) {
      if (this.vibrate && typeof vibrateDevice === 'function') {
        vibrateDevice();
      }
      this.prevNumOfWhiteDots = numOfWhiteDots;
    }
    
    dots.forEach((dot, index) => {
      if (index < numOfWhiteDots) {
        dot.classList.add('white-dot');
      } else {
        dot.classList.remove('white-dot');
      }
    });
  }

  /**
   * Render gradient for gradient-based sliders
   */
  renderGradient(value) {
    if (!this.sliderElement) return;
    
    const min = parseInt(this.sliderElement.min) || 0;
    const max = parseInt(this.sliderElement.max) || 255;
    const percentage = ((value - min) / (max - min)) * 100;
    
    this.sliderElement.style.background = 
      `linear-gradient(to right, white 0%, white ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
  }
}
