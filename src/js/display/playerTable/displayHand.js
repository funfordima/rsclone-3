class DisplayHand {
  init() {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('hand-wrapper');
    this.btns = document.createElement('div');
    this.btns.classList.add('container');
    this.btns.append(this.button('up'), this.button('down'));
    this.wrapper.append(this.btns);
    return this.wrapper;
  }

  button(direction) {
    this.btn = document.createElement('div');
    this.btn.classList.add('playBut');
    this.btn.classList.add(`${direction}`);
    this.btn.innerHTML = /* html */ `
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
      xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"
      x="0px" y="0px" width="100px" height="80px" viewBox="0 0 213.7 213.7" enable-background="new 0 0 213.7 213.7"
      xml:space="preserve">

      <polygon class='triangle' id="XMLID_18_" fill="none" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" points="
      73.5,62.5 148.5,105.8 73.5,149.1 "/>

      <circle class='circle' id="XMLID_17_" fill="none"  stroke-width="7" stroke-linecap="round" stroke-linejoin="round"  stroke-miterlimit="10" cx="106.8" cy="106.8" r="103.3"/>
    </svg>
    `;

    return this.btn;
  }
}

export default DisplayHand;
