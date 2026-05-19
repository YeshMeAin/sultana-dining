import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["backdrop", "panel"]

  open() {
    this.element.classList.remove("pointer-events-none")
    this.element.setAttribute("aria-hidden", "false")

    this.backdropTarget.classList.remove("opacity-0", "pointer-events-none")
    this.backdropTarget.classList.add("opacity-100", "pointer-events-auto")

    this.panelTarget.style.transform = "translateX(0)"

    document.body.classList.add("overflow-hidden")

    this._escHandler = (e) => { if (e.key === "Escape") this.close() }
    document.addEventListener("keydown", this._escHandler)
  }

  close() {
    const isRtl = document.documentElement.dir === "rtl"
    this.panelTarget.style.transform = isRtl ? "translateX(-100%)" : "translateX(100%)"

    this.backdropTarget.classList.remove("opacity-100", "pointer-events-auto")
    this.backdropTarget.classList.add("opacity-0", "pointer-events-none")

    setTimeout(() => {
      this.element.classList.add("pointer-events-none")
      this.element.setAttribute("aria-hidden", "true")
    }, 300)

    document.body.classList.remove("overflow-hidden")

    if (this._escHandler) {
      document.removeEventListener("keydown", this._escHandler)
      this._escHandler = null
    }
  }

  disconnect() {
    document.body.classList.remove("overflow-hidden")
    if (this._escHandler) {
      document.removeEventListener("keydown", this._escHandler)
    }
  }
}
