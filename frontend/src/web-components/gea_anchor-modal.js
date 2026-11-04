// Base shadow-DOM template: a built-in trigger (an <a> styled as a button) plus
// the <dialog> shell.
// The dialog body exposes a default <slot> so the host's light-DOM children
// (e.g. <main>...</main>) are projected into the dialog automatically. A second
// named "actions" slot collects action buttons into the bottom-right corner.
const dialogTemplate = document.createElement('template');
dialogTemplate.innerHTML = `
    <a class="gea-anchor-modal__trigger" part="trigger" role="button" tabindex="0" aria-haspopup="dialog">
        <slot name="trigger-label">Open</slot>
    </a>

    <dialog class="gea-anchor-modal" part="dialog">
        <button class="gea-anchor-modal__close" part="close" type="button" data-close aria-label="Close">&times;</button>
        <div class="gea-anchor-modal__body" part="body">
            <slot></slot>
        </div>
        <div class="gea-anchor-modal__actions" part="actions">
            <slot name="actions"></slot>
        </div>
    </dialog>
`;

// Constructable stylesheet shared across instances.
// All of the component's CSS is encapsulated here. Every value is expressed as
// a CSS custom property with a fallback default, so the dialog renders
// correctly even when the host provides no styling at all.
const dialogStyles = new CSSStyleSheet();
dialogStyles.replaceSync(`
    :host {
        /* --- default theme values (override from outside, e.g.
               gea-anchor-modal { --gea-anchor-modal-bg: #000; }) --- */
        --gea-anchor-modal-bg: #ffffff;
        --gea-anchor-modal-color: #1e293b;
        --gea-anchor-modal-border-width: 2px;
        --gea-anchor-modal-border-color: #1e293b;
        --gea-anchor-modal-radius: 8px;
        --gea-anchor-modal-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        --gea-anchor-modal-max-width: 650px;
        --gea-anchor-modal-max-height: 90vh;
        --gea-anchor-modal-padding: 1.25rem;
        --gea-anchor-modal-backdrop: rgba(0, 0, 0, 0.5);
        --gea-anchor-modal-transition: .7s ease;

        /* Open/close animation of the dialog itself */
        --gea-anchor-modal-open-duration: 0.7s;
        --gea-anchor-modal-close-duration: 0.4s;

        /* Slot content spacing (top/bottom) */
        --gea-anchor-modal-content-margin-top: 20px;
        --gea-anchor-modal-content-margin-bottom: 20px;

        /* Bottom-right action row spacing */
        --gea-anchor-modal-actions-margin-right: 7px;
        --gea-anchor-modal-actions-margin-bottom: 7px;
        --gea-anchor-modal-actions-gap: 10px;

        --gea-anchor-modal-trigger-bg: #1e293b;
        --gea-anchor-modal-trigger-color: #1e293b;
        --gea-anchor-modal-trigger-padding: 0.6rem 1.25rem;
        --gea-anchor-modal-trigger-radius: 6px;

        --gea-anchor-modal-button-padding: 0.5rem 1rem;
        --gea-anchor-modal-button-bg: #ffffff;
        --gea-anchor-modal-button-color: #1e293b;
        --gea-anchor-modal-button-primary-bg: #1e293b;
        --gea-anchor-modal-button-primary-color: #ffffff;

        --gea-anchor-modal-close-size: 28px;
        --gea-anchor-modal-close-bg: transparent;
        --gea-anchor-modal-close-color: #1e293b;
        --gea-anchor-modal-close-hover-bg: #1e293b;
        --gea-anchor-modal-close-hover-color: #ffffff;

        display: inline-block;
        box-sizing: border-box;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    *,
    *::before,
    *::after {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    /* Built-in trigger: an <a> styled to behave like a button.
       No href is set, so the element is not a hyperlink and never navigates.
       role="button" + tabindex="0" (in the template) restore the button
       semantics that <button> would have provided. */
    .gea-anchor-modal__trigger {
        font: inherit;
        cursor: pointer;
        display: inline-block;
        text-align: center;
        text-decoration: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        /* padding: var(--gea-anchor-modal-trigger-padding, 0.6rem 1.25rem);*/
        /* background-color: var(--gea-anchor-modal-trigger-bg, #1e293b);*/
        color: var(--gea-anchor-modal-trigger-color, #ffffff);
        /* border: none;*/
        /* border-radius: var(--gea-anchor-modal-trigger-radius, 6px);*/
        transition: opacity var(--gea-anchor-modal-transition, 0.2s ease);
    }

    .gea-anchor-modal__trigger:hover {
        opacity: 0.85;
    }

    /* Visible focus ring (keyboard only) */
    .gea-anchor-modal__trigger:focus-visible {
        outline: 2px solid currentColor;
        outline-offset: 2px;
    }

    /* The dialog surface: centered in the viewport and responsively sized */
    .gea-anchor-modal {
        position: fixed;
        inset: 0;
        margin: auto;
        width: min(var(--gea-anchor-modal-max-width, 650px), calc(100vw - 2rem));
        height: fit-content;
        max-height: var(--gea-anchor-modal-max-height, 90vh);
        flex-direction: column;
        background-color: var(--gea-anchor-modal-bg, #ffffff);
        color: var(--gea-anchor-modal-color, #1e293b);
        border: var(--gea-anchor-modal-border-width, 2px) solid var(--gea-anchor-modal-border-color, #1e293b);
        border-radius: var(--gea-anchor-modal-radius, 8px);
        box-shadow: var(--gea-anchor-modal-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
        overflow: hidden;

        /* --- open/close animation --------------------------------------------
           A <dialog> toggles display:none <-> display:flex and display is not
           animatable, so without help the dialog would pop in and vanish
           instantly. Three pieces make it animate:

           - transition-behavior: allow-discrete lets the display property take
             part in the transition, so display:none is applied at the very END
             of the closing animation and the fade-out stays visible.
           - The overlay property keeps a modal dialog in the top layer while
             it fades out; otherwise it would be removed from the top layer
             at once.
           - @starting-style (below) supplies the state the opening animation
             starts from, because a display:none element has no previous style.

           The duration of a transition comes from the AFTER-change style, so
           the [open] rule carries the opening duration and this rule carries
           the closing duration.

           The longhand form is used on purpose: a browser that does not
           understand transition-behavior drops only that declaration and still
           animates opacity/transform. */
        opacity: 0;
        transform: translateY(-10px) scale(0.98);
        transition-property: opacity, transform, display, overlay;
        transition-duration: var(--gea-anchor-modal-close-duration, 0.4s);
        transition-timing-function: ease;
        transition-behavior: allow-discrete;
    }

    /* Keep the native closed state; only lay out as flex when open */
    .gea-anchor-modal[open] {
        display: flex;
        opacity: 1;
        transform: none;
        transition-property: opacity, transform, display, overlay;
        transition-duration: var(--gea-anchor-modal-open-duration, 0.7s);
        transition-timing-function: ease;
        transition-behavior: allow-discrete;
    }

    /* The state the opening animation starts from */
    @starting-style {
        .gea-anchor-modal[open] {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
        }
    }

    /* The dimming layer behind a modal dialog fades along with the dialog */
    .gea-anchor-modal::backdrop {
        background-color: var(--gea-anchor-modal-backdrop, rgba(0, 0, 0, 0.5));
        opacity: 0;
        transition-property: opacity, overlay;
        transition-duration: var(--gea-anchor-modal-close-duration, 0.4s);
        transition-timing-function: ease;
        transition-behavior: allow-discrete;
    }

    .gea-anchor-modal[open]::backdrop {
        opacity: 1;
        transition-duration: var(--gea-anchor-modal-open-duration, 0.7s);
    }

    @starting-style {
        .gea-anchor-modal[open]::backdrop {
            opacity: 0;
        }
    }

    /* Close button, pinned to the top-right of the dialog */
    .gea-anchor-modal__close {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        width: var(--gea-anchor-modal-close-size, 28px);
        height: var(--gea-anchor-modal-close-size, 28px);
        border: var(--gea-anchor-modal-border-width, 2px) solid var(--gea-anchor-modal-border-color, #1e293b);
        border-radius: 50%;
        background: var(--gea-anchor-modal-close-bg, transparent);
        color: var(--gea-anchor-modal-close-color, #1e293b);
        font-size: 0.875rem;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        transition: background-color var(--gea-anchor-modal-transition, 0.2s ease),
                    color var(--gea-anchor-modal-transition, 0.2s ease);
    }

    .gea-anchor-modal__close:hover {
        background-color: var(--gea-anchor-modal-close-hover-bg, #1e293b);
        color: var(--gea-anchor-modal-close-hover-color, #ffffff);
    }

    /* Content area holding the projected light-DOM content (centered) */
    .gea-anchor-modal__body {
        flex: 1 1 auto;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--gea-anchor-modal-padding, 1.25rem);
    }

    /* Slotted content gets a default 20px top/bottom margin (overridable) */
    .gea-anchor-modal__body ::slotted(*) {
        margin-top: var(--gea-anchor-modal-content-margin-top, 20px);
        margin-bottom: var(--gea-anchor-modal-content-margin-bottom, 20px);
    }

    /* Action row pinned to the bottom-right, 7px margins, 10px gap */
    .gea-anchor-modal__actions {
        flex: 0 0 auto;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: var(--gea-anchor-modal-actions-gap, 10px);
        margin-right: var(--gea-anchor-modal-actions-margin-right, 7px);
        margin-bottom: var(--gea-anchor-modal-actions-margin-bottom, 7px);
    }

    /* Consistent styling for the host-provided action buttons */
    .gea-anchor-modal__actions ::slotted(button) {
        box-sizing: border-box;
        font: inherit;
        cursor: pointer;
        padding: var(--gea-anchor-modal-button-padding, 0.5rem 1rem);
        border: var(--gea-anchor-modal-border-width, 2px) solid var(--gea-anchor-modal-border-color, #1e293b);
        border-radius: var(--gea-anchor-modal-trigger-radius, 6px);
        background-color: var(--gea-anchor-modal-button-bg, #ffffff);
        color: var(--gea-anchor-modal-button-color, #1e293b);
        transition: opacity var(--gea-anchor-modal-transition, 0.2s ease);
    }

    /* Closing buttons read as the primary action; others stay secondary */
    .gea-anchor-modal__actions ::slotted([data-close]) {
        background-color: var(--gea-anchor-modal-button-primary-bg, #1e293b);
        color: var(--gea-anchor-modal-button-primary-color, #ffffff);
    }

    .gea-anchor-modal__actions ::slotted(button:hover) {
        opacity: 0.85;
    }

    /* Responsive sizing for tablets */
    @media (max-width: 768px) {
        .gea-anchor-modal {
            --gea-anchor-modal-max-width: 92vw;
            --gea-anchor-modal-padding: 1.1rem;
        }
    }

    /* Responsive sizing for mobile devices */
    @media (max-width: 480px) {
        .gea-anchor-modal {
            --gea-anchor-modal-max-width: 100vw;
            --gea-anchor-modal-padding: 0.9rem;
            --gea-anchor-modal-max-height: 100vh;
            --gea-anchor-modal-radius: 0;
        }
    }
`);

class GEA_AnchorModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [dialogStyles];

        // Append dialog shell into Shadow Root
        this.shadowRoot.appendChild(dialogTemplate.content.cloneNode(true));
        this._dialog = this.shadowRoot.querySelector('dialog.gea-anchor-modal');
        this._trigger = this.shadowRoot.querySelector('.gea-anchor-modal__trigger');

        // Bound router passed to addEventListener. A private method can't act as
        // an EventListener object (that interface looks up a public `handleEvent`).
        this._handleEvent = (event) => this.#handleEvent(event);

        // Optional user-supplied behavior for [data-action] buttons.
        // Signature: (action, button, event) => void
        this.onAction = null;
    }

    connectedCallback() {
        this.shadowRoot.addEventListener('click', this._handleEvent);
        this.shadowRoot.addEventListener('keydown', this._handleEvent);
        this._dialog.addEventListener('close', this._handleEvent);
        this._dialog.addEventListener('cancel', this._handleEvent);
    }

    disconnectedCallback() {
        this.shadowRoot.removeEventListener('click', this._handleEvent);
        this.shadowRoot.removeEventListener('keydown', this._handleEvent);
        this._dialog.removeEventListener('close', this._handleEvent);
        this._dialog.removeEventListener('cancel', this._handleEvent);
    }

    /** Whether the dialog is currently open. */
    get open() {
        return this._dialog.open;
    }

    /** Opens the dialog as a non-modal dialog. */
    show() {
        if (!this._dialog.open) {
            this._dialog.show();
        }
    }

    /** Opens the dialog as a modal dialog (with backdrop). */
    showModal() {
        if (!this._dialog.open) {
            this._dialog.showModal();
        }
    }

    /** Closes the dialog. */
    close(returnValue) {
        this._dialog.close(returnValue);
    }

    /**
     * Private event router, wired up from connectedCallback/disconnectedCallback.
     * @param {Event} event
     */
    #handleEvent(event) {
        const target = event.target;

        switch (event.type) {
            case 'click':
                // Built-in trigger opens the modal dialog
                if (target.closest && target.closest('.gea-anchor-modal__trigger')) {
                    this.showModal();
                    return;
                }

                // User-provided buttons: handleEvent routes the click, but the
                // behavior is defined by the user (callback and/or custom event).
                const actionEl = target.closest && target.closest('[data-action]');
                if (actionEl) {
                    const action = actionEl.dataset.action;

                    // (1) Optional callback assigned by the user
                    if (typeof this.onAction === 'function') {
                        this.onAction(action, actionEl, event);
                    }

                    // (2) Custom event the user can listen for
                    this.dispatchEvent(new CustomEvent('gea-anchor-modal-action', {
                        bubbles: true,
                        composed: true,
                        detail: { action, button: actionEl }
                    }));
                    return;
                }

                // Any element marked with [data-close] (including slotted content) closes it
                if (target.closest && target.closest('[data-close]')) {
                    this.close();
                }
                break;

            case 'keydown':
                // The trigger is an <a>, not a <button>, so Enter/Space are not
                // activated natively: handle them to keep the button behavior.
                if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
                    if (target.closest && target.closest('.gea-anchor-modal__trigger')) {
                        // preventDefault stops Space from scrolling the page
                        event.preventDefault();
                        this.showModal();
                    }
                }
                break;

            case 'cancel':
                // The only close path is the closing button: block Esc/backdrop dismissal
                event.preventDefault();
                break;

            case 'close':
                // Dialog actually closed (closing button / close() call) -> notify host
                this.dispatchEvent(new CustomEvent('gea-anchor-modal-close', {
                    bubbles: true,
                    composed: true
                }));
                break;
        }
    }
}

window.customElements.define('gea-anchor-modal', GEA_AnchorModal);
