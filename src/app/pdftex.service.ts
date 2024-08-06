import { Injectable } from '@angular/core';
import { PdfTeXEngine } from "../assets/js/SwiftLatex20220220/PdfTeXEngine"

@Injectable({
  providedIn: 'root'
})
export class PdfTex {
  engine: Promise<PdfTeXEngine>


  constructor() {
    const engine = new PdfTeXEngine()
    if (engine.isReady()) {
      this.engine = Promise.resolve(engine);
    } else {
      this.engine = engine.loadEngine().then(() => engine);
    }
  }

  async compile(program: string | Uint8Array): Promise<Uint8Array> {
    const e = await this.engine;
    e.writeMemFSFile("main.tex", program)
    e.setEngineMainFile("main.tex");
    const result = await e.compileLaTeX()
    if (result.pdf != undefined) {
      return result.pdf
    }
    throw new Error(result.log)
  }
}
