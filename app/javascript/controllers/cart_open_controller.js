import { Controller } from "@hotwired/stimulus"

// Tiny controller that opens the cart drawer when connected to the DOM.
// Used by the create.turbo_stream.erb to auto-open the drawer after adding an item.
export default class extends Controller {
  connect() {
    window.dispatchEvent(new CustomEvent("cart:open"))
    this.element.remove()
  }
}
