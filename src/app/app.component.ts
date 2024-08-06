import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PdfTex } from './pdftex.service';
import { AcrFormatService, Puzzle } from './acrformat.service';
import { PuzzleTemplatingService } from './puzzle_templating.service';
import { CommonModule } from '@angular/common';

interface DisplayState {
  filename: string | undefined
  puzzle: Puzzle | undefined
  pdfUrl: string | undefined
  texUrl: string | undefined
  error: string | undefined
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  state!: DisplayState;

  constructor(private pdftex: PdfTex, private acrFormat: AcrFormatService, private puzzleTemplating: PuzzleTemplatingService) {
    this.clearState()
  }

  clearState() {
    if (this.state?.pdfUrl) {
      URL.revokeObjectURL(this.state.pdfUrl);
    }
    if (this.state?.texUrl) {
      URL.revokeObjectURL(this.state.texUrl);
    }
    this.state = {
      filename: undefined,
      puzzle: undefined,
      pdfUrl: undefined,
      texUrl: undefined,
      error: undefined
    }
  }

  async handleFile(file: File): Promise<void> {
    this.state.filename = file.name;
    const text = await file.text();
    const puzzle = this.acrFormat.parseFile(text);
    this.state.puzzle = puzzle;
    const latex = await this.puzzleTemplating.puzzleToLatex(puzzle);
    this.state.texUrl = URL.createObjectURL(new Blob([latex], { type: 'text/plain' }));
    const pdf = await this.pdftex.compile(latex);
    this.state.pdfUrl = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  }


  onFile(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.item(0);
    if (file) {
      this.clearState();
      this.handleFile(file).catch((e) => {
        this.state.error = e.message;
      });

    }
  }
}
