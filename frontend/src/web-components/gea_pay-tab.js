// Module-level counter so every instance gets a unique radio group name
let instanceCount = 0;

// Template is created once at module scope, shared by all instances
const userTestTemplate = document.createElement('template');
userTestTemplate.innerHTML = `
    <div class="widget">
        <div class="tabs"></div>
        <div class="tab-content"></div>
    </div>
    <!-- Hidden slot: used only to detect when the light DOM is ready -->
    <slot hidden></slot>
`;

// Constructable stylesheet: parsed once, shared across every shadow root
const userTestStyles = new CSSStyleSheet();
userTestStyles.replaceSync(`
    :host {
        display: block;
        /* Default customizable CSS variables */
        --gea-tab-font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        --gea-tab-font-size: 1rem;
        --gea-tab-line-height: 1.7;
        --gea-tab-color: #101010;
        --gea-tab-bg: #ffffff;
        --gea-tab-radius: 1rem;
        --gea-tab-shadow: 0 10px 20px 0 rgba(0, 0, 0, 0.025);
        --gea-tab-width: 80vw;
        --gea-tab-max-width: 600px;
        --gea-tab-padding: 1rem;
        --gea-tab-margin: 2rem auto;
        --gea-tab-border-color: #e9ebec;
        --gea-tab-height: 3.5rem;
        --gea-tab-inactive-color: #656d7b;
        --gea-tab-active-color: #101010;
        --gea-tab-marker-bg-start: #edf4ff;
        --gea-tab-marker-bg-end: #ffffff;
        --gea-tab-label-font-size: 0.9375rem;
        --gea-tab-label-font-weight: 600;
        --gea-tab-label-font-weight-active: 600;
        --gea-tab-content-padding: 1rem;
        --gea-tab-transition-duration: 0.5s;

        font-family: var(--gea-tab-font-family);
        font-size: var(--gea-tab-font-size);
        line-height: var(--gea-tab-line-height);
        color: var(--gea-tab-color);
    }

    *,
    *::before,
    *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    h2 {
        font-size: 1.125rem;
        font-weight: 600;
        margin-block-end: 0.5em;
    }

    p:not(:last-child) {
        margin-block-end: 1em;
    }

    .widget {
        width: var(--gea-tab-width);
        max-width: var(--gea-tab-max-width);
        padding: var(--gea-tab-padding);
        margin: var(--gea-tab-margin);
        border-radius: var(--gea-tab-radius);
        background-color: var(--gea-tab-bg);
        box-shadow: var(--gea-tab-shadow);
    }

    .tabs {
        --tab-count: 3;
        --active: 0;

        position: relative;
        isolation: isolate;
        display: flex;
        height: var(--gea-tab-height);
        border-block-end: 1px solid var(--gea-tab-border-color);
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: thin;
    }

    .tabs input {
        display: none;
    }

    .tabs label {
        flex: 1 0 auto;
        min-width: max-content;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 0.75rem;
        font-size: var(--gea-tab-label-font-size);
        font-weight: var(--gea-tab-label-font-weight);
        color: var(--gea-tab-inactive-color);
        cursor: pointer;
        transition: color var(--gea-tab-transition-duration) ease-in-out;
        white-space: nowrap;
    }

    .tabs input:checked + label {
        color: var(--gea-tab-active-color);
        font-weight: var(--gea-tab-label-font-weight-active);
    }

    .tabs::after {
        pointer-events: none;
        position: absolute;
        content: "";
        z-index: -1;
        inset: 0 0 -1px;
        width: calc((100% / var(--tab-count)) - 2px);
        border-radius: 0.5rem 0.5rem 0 0;
        border: 1px solid var(--gea-tab-border-color);
        border-block-end: none;
        background-image: linear-gradient(var(--gea-tab-marker-bg-start), var(--gea-tab-marker-bg-end));
        translate: calc(var(--active) * 100%);
        transition: translate var(--gea-tab-transition-duration) ease-in-out;
    }

    .tab-content {
        padding: var(--gea-tab-content-padding);
    }

    [class^="tab-content-"] {
        display: none;
    }

    /* Responsive styles for tablet devices */
    @media (max-width: 768px) {
        :host {
            --gea-tab-width: 90vw;
            --gea-tab-max-width: 100%;
            --gea-tab-font-size: 0.9375rem;
            --gea-tab-padding: 0.875rem;
            --gea-tab-margin: 1.5rem auto;
            --gea-tab-height: 3.25rem;
            --gea-tab-label-font-size: 0.875rem;
            --gea-tab-content-padding: 0.875rem;
        }

        .widget {
            margin: var(--gea-tab-margin);
        }

        .tabs label {
            padding: 0 0.625rem;
        }
    }

    /* Responsive styles for mobile devices */
    @media (max-width: 480px) {
        :host {
            --gea-tab-width: 95vw;
            --gea-tab-max-width: 100%;
            --gea-tab-font-size: 0.875rem;
            --gea-tab-line-height: 1.6;
            --gea-tab-padding: 0.75rem;
            --gea-tab-margin: 1rem auto;
            --gea-tab-height: 3rem;
            --gea-tab-label-font-size: 0.8125rem;
            --gea-tab-content-padding: 0.75rem;
            --gea-tab-radius: 0.75rem;
        }

        .widget {
            margin: var(--gea-tab-margin);
            border-radius: var(--gea-tab-radius);
        }

        .tabs {
            height: var(--gea-tab-height);
        }

        .tabs label {
            padding: 0 0.5rem;
            font-size: var(--gea-tab-label-font-size);
        }

        .tabs::after {
            border-radius: 0.375rem 0.375rem 0 0;
        }

        h2 {
            font-size: 1rem;
        }
    }

    /* Responsive styles for very small mobile devices */
    @media (max-width: 360px) {
        :host {
            --gea-tab-width: 100vw;
            --gea-tab-padding: 0.625rem;
            --gea-tab-margin: 0.75rem auto;
            --gea-tab-height: 2.75rem;
            --gea-tab-label-font-size: 0.75rem;
            --gea-tab-content-padding: 0.625rem;
        }

        .widget {
            border-radius: 0.5rem;
            box-shadow: 0 5px 10px 0 rgba(0, 0, 0, 0.025);
        }

        .tabs label {
            padding: 0 0.375rem;
        }
    }
`);

class PaymentTab extends HTMLElement {
    // Private method/function declared cleanly
    #text = "I'm Here!!!";
    #count = () => {
        console.log(this.#text);
    };

    // Unique group name per instance, so multiple widgets cannot clash
    #groupName = `gea-pay-tab-${++instanceCount}`;

    // Per-instance rules generated from the number of light DOM tabs
    #tabStyles = new CSSStyleSheet();

    // Used to avoid rebuilding the same light DOM twice
    #renderedSignature = '';

    /**
    * Instantiate our new component
    */
    constructor() {
        // Inherit parent class properties
        super();

        // Define Shadow properties
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [userTestStyles, this.#tabStyles];
        this.shadowRoot.appendChild(userTestTemplate.content.cloneNode(true));

        // Cache the internal references once, reused in connect/disconnect
        this._widget = this.shadowRoot.querySelector('.widget');
        this._tabs = this.shadowRoot.querySelector('.tabs');
        this._tabContent = this.shadowRoot.querySelector('.tab-content');
        this._slot = this.shadowRoot.querySelector('slot');
    }

    connectedCallback() {
        this._widget.addEventListener('mouseenter', this);
        this._slot.addEventListener('slotchange', this);

        // Render immediately if the light DOM was already parsed
        this.#render();
    }

    disconnectedCallback() {
        this._widget.removeEventListener('mouseenter', this);
        this._slot.removeEventListener('slotchange', this);
    }

    /**
    * Build the CSS-only tab structure from the light DOM
    */
    #render() {
        const items = [...this.querySelectorAll(':scope > content')];

        // Nothing to render yet (the light DOM may still be parsing)
        if (!items.length) {
            return;
        }

        // Avoid rebuilding when the same light DOM is reported again
        const signature = items
            .map(item => `${item.querySelector(':scope > title')?.textContent ?? ''}|${item.querySelector(':scope > main')?.innerHTML ?? ''}`)
            .join('\u0000');

        if (signature === this.#renderedSignature) {
            return;
        }
        this.#renderedSignature = signature;

        this._tabs.replaceChildren();
        this._tabContent.replaceChildren();

        items.forEach((item, index) => {
            const tabNumber = index + 1;
            const title = item.querySelector(':scope > title')?.textContent.trim() || `Tab ${tabNumber}`;
            const main = item.querySelector(':scope > main');

            // Radio input drives the CSS-only active state
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = this.#groupName;
            input.id = `${this.#groupName}-${tabNumber}`;
            input.checked = index === 0;

            // Label displays the light DOM title
            const label = document.createElement('label');
            label.htmlFor = input.id;
            label.textContent = title;

            this._tabs.append(input, label);

            // Panel holds a copy of the light DOM main content
            const panel = document.createElement('div');
            panel.className = `tab-content-${tabNumber}`;

            if (main) {
                panel.append(main.cloneNode(true));
            }

            this._tabContent.append(panel);
        });

        // The marker width depends on how many tabs this instance has
        this._tabs.style.setProperty('--tab-count', items.length);
        this.#applyTabRules(items.length);
    }

    /**
    * Generate the indexed :has() rules for this instance's tab count
    * @param {number} count Number of tabs
    */
    #applyTabRules(count) {
        let css = '';

        for (let i = 1; i <= count; i++) {
            css += `
                .tabs:has(:checked:nth-of-type(${i})) {
                    --active: ${i - 1};
                }

                .widget:has(:checked:nth-of-type(${i})) .tab-content-${i} {
                    display: block;
                }
            `;
        }

        this.#tabStyles.replaceSync(css);
    }

    /**
    * EventListener interface entry point
    * @param {Event} event The event object
    */
    handleEvent(event) {
        this.#handleEvent(event);
    }

    /**
    * Handle events using EventListener object interface
    * @param  {Event} event The event object
    */
    #handleEvent(event) {
        if (event.type === 'mouseenter') {
            this.#count(); // Call the private method with parentheses
        }

        if (event.type === 'slotchange') {
            this.#render();
        }
    }
}

window.customElements.define('gea_pay-tab', PaymentTab);
