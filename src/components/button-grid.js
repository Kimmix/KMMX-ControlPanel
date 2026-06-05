/**
 * ButtonGrid Component
 * Reusable component for creating button grids with icon or placeholder support
 *
 * Features:
 * - Automatic button creation from data array
 * - Icon or placeholder text support
 * - Active state management
 * - Custom click handlers
 * - Automatic count display updates
 */

class ButtonGrid {
  /**
   * Create a ButtonGrid
   * @param {Object} config - Configuration object
   * @param {string} config.containerId - ID of the container element
   * @param {Array} config.items - Array of button items
   * @param {string} config.items[].id - Unique identifier for the item
   * @param {string} config.items[].buttonId - DOM ID for the button element
   * @param {string} config.items[].name - Display name for the button
   * @param {string} [config.items[].src] - Optional icon source path
   * @param {Function} config.onClick - Click handler function (receives item object)
   * @param {string} [config.buttonClass='exp-btn'] - Additional CSS class for buttons
   * @param {string} [config.countElementId] - Optional ID of element to display button count
   * @param {number} [config.initialActiveIndex=0] - Index of initially active button
   */
  constructor(config) {
    this.container = document.getElementById(config.containerId);
    this.items = config.items;
    this.onClick = config.onClick;
    this.buttonClass = config.buttonClass || 'exp-btn';
    this.countElementId = config.countElementId;
    this.activeButton = null;

    if (!this.container) {
      console.error(`ButtonGrid: Container with id "${config.containerId}" not found`);
      return;
    }

    this.render();

    // Set initial active button if specified
    if (config.initialActiveIndex !== undefined && this.items[config.initialActiveIndex]) {
      this.setActive(this.items[config.initialActiveIndex].buttonId);
    }
  }

  /**
   * Render all buttons in the grid
   */
  render() {
    // Clear existing content
    this.container.innerHTML = '';

    // Update count display if element ID provided
    if (this.countElementId) {
      const countElement = document.getElementById(this.countElementId);
      if (countElement) {
        countElement.textContent = this.items.length;
      }
    }

    // Create buttons
    this.items.forEach(item => {
      const button = this.createButton(item);
      this.container.appendChild(button);
    });
  }

  /**
   * Create a single button element
   * @param {Object} item - Button item data
   * @returns {HTMLButtonElement} The created button element
   */
  createButton(item) {
    const button = document.createElement('button');
    button.id = item.buttonId;
    button.className = `btn-base ${this.buttonClass}`;
    button.onclick = () => this.handleClick(item);

    // Add placeholder class and text if no icon is available
    if (!item.src) {
      button.classList.add('placeholder');
      button.title = item.name;

      // Create text element for placeholder
      const textSpan = document.createElement('span');
      textSpan.className = 'placeholder-text';
      textSpan.textContent = item.name;
      button.appendChild(textSpan);
    } else {
      // Create image element for icon
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.name;
      button.appendChild(img);
    }

    return button;
  }

  /**
   * Handle button click
   * @param {Object} item - Clicked item data
   */
  handleClick(item) {
    const buttonId = item.buttonId;
    this.setActive(buttonId);

    // Call the custom onClick handler
    if (this.onClick) {
      this.onClick(item);
    }
  }

  /**
   * Set a button as active by its ID
   * @param {string} buttonId - ID of the button to activate
   */
  setActive(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    // Remove active class from previous button
    if (this.activeButton && this.activeButton !== button) {
      this.activeButton.classList.remove('active');
    }

    // Add active class to new button
    button.classList.add('active');
    this.activeButton = button;
  }

  /**
   * Set active button by item ID (not buttonId)
   * @param {number|string} itemId - The item's id property
   */
  setActiveById(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      this.setActive(item.buttonId);
    } else {
      // Default to first item if not found
      if (this.items.length > 0) {
        this.setActive(this.items[0].buttonId);
      }
    }
  }

  /**
   * Get currently active item
   * @returns {Object|null} The active item or null
   */
  getActiveItem() {
    if (!this.activeButton) return null;
    return this.items.find(item => item.buttonId === this.activeButton.id);
  }
}
