import { Controller } from "@hotwired/stimulus"

// Simple image carousel with auto-advance + dot navigation.
// Usage:
//   <div data-controller="carousel" data-carousel-interval-value="5000">
//     <div data-carousel-target="slide" class="...">...</div>
//     <div data-carousel-target="slide" class="...">...</div>
//     <button data-carousel-target="dot" data-action="click->carousel#goTo" data-index="0"></button>
//     <button data-action="click->carousel#prev">‹</button>
//     <button data-action="click->carousel#next">›</button>
//   </div>
export default class extends Controller {
  static targets = ["slide", "dot"]
  static values = { index: { type: Number, default: 0 }, interval: { type: Number, default: 5000 } }

  connect() {
    this.show(this.indexValue)
    this.startAuto()
    this.element.addEventListener("mouseenter", () => this.stopAuto())
    this.element.addEventListener("mouseleave", () => this.startAuto())
  }

  disconnect() { this.stopAuto() }

  next() { this.show((this.indexValue + 1) % this.slideTargets.length) }
  prev() { this.show((this.indexValue - 1 + this.slideTargets.length) % this.slideTargets.length) }

  goTo(event) {
    const i = parseInt(event.currentTarget.dataset.index, 10)
    if (!Number.isNaN(i)) this.show(i)
  }

  show(i) {
    this.indexValue = i
    this.slideTargets.forEach((el, idx) => {
      const active = idx === i
      el.classList.toggle("opacity-100", active)
      el.classList.toggle("opacity-0", !active)
      el.classList.toggle("pointer-events-none", !active)
      el.setAttribute("aria-hidden", active ? "false" : "true")
    })
    if (this.hasDotTarget) {
      this.dotTargets.forEach((el, idx) => {
        el.classList.toggle("bg-clay-500", idx === i)
        el.classList.toggle("bg-sand-300", idx !== i)
        el.classList.toggle("w-8", idx === i)
        el.classList.toggle("w-2.5", idx !== i)
      })
    }
  }

  startAuto() {
    this.stopAuto()
    this.timer = setInterval(() => this.next(), this.intervalValue)
  }

  stopAuto() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}
