import { Injectable } from '@angular/core';
import { AcrFormatService, Puzzle, Clue, Grid } from './acrformat.service';
import { Liquid } from 'liquidjs';
import { HttpClient } from '@angular/common/http';
import { RouterLinkWithHref } from '@angular/router';

const _CLUE_ANSWER_MAX_LINE_LENGTH = 14;
const _AUTHOR_MAX_LINE_LENGTH = 28;

interface BlackSquare {
  row: number
  column: number
}

interface WhiteSquare {
  row: number
  column: number
  label: string
  index: number
  value: string
}

interface AuthorChar {
  row: number
  column: number
  label: string
  index: number
}

interface DisplayChar {
  row: number
  column: number
  index: number
}

interface DisplayClue {
  label: string
  hint: string
  answer: DisplayChar[]
}

interface PuzzleTemplate {
  title: string
  author: string
  white_squares: WhiteSquare[]
  black_squares: BlackSquare[]
  quote_author: AuthorChar[]
  clues: DisplayClue[]
}

@Injectable({
  providedIn: 'root',
})
export class PuzzleTemplatingService {
  engine: Liquid

  constructor(private httpClient: HttpClient) {
    this.engine = new Liquid()
  }

puzzleToTemplateData(puzzle: Puzzle, fillAnswers: boolean): PuzzleTemplate {
  const output: PuzzleTemplate = {
    title: puzzle.title,
    author: puzzle.author,
    white_squares: [],
    black_squares: [],
    quote_author: [],
    clues: []
  };

  let index = 1;
  for (let row = 0; row < puzzle.grid.height; row++) {
    for (let col = 0; col < puzzle.grid.width; col++) {
      const display_row = puzzle.grid.height - row;
      const display_col = col;
      const gridChar = puzzle.grid.grid[row][col];
      if (gridChar == '#') {
        output.black_squares.push({
          row: display_row,
          column: display_col,
        });
        continue;
      }
      const label = puzzle.labels.get(index)!;
      const displayChar = fillAnswers ? gridChar : '';
      output.white_squares.push({
        row: display_row,
        column: display_col,
        label: label,
        index: index,
        value: displayChar,
      });
      index++;
    }
  }
  const authorMaxHeight = Math.ceil(puzzle.clues.length / _AUTHOR_MAX_LINE_LENGTH);
  for(let i=0; i<puzzle.clues.length; i++) {
    const clue = puzzle.clues[i];
    output.quote_author.push({
      row: authorMaxHeight - Math.floor(i / _AUTHOR_MAX_LINE_LENGTH),
      column: i % _AUTHOR_MAX_LINE_LENGTH,
      label: clue.label,
      index: clue.mapping[0],
    });
  }
  for(const clue of puzzle.clues) {
    const answer: DisplayChar[] = [];
    const clueMaxHeight = Math.ceil(clue.mapping.length / _CLUE_ANSWER_MAX_LINE_LENGTH);
    for (let i = 0; i < clue.mapping.length; i++) {
      answer.push({
        row: clueMaxHeight - Math.floor(i / _CLUE_ANSWER_MAX_LINE_LENGTH),
        column: i % _CLUE_ANSWER_MAX_LINE_LENGTH,
        index: clue.mapping[i],
      });
    }
    output.clues.push({
      label: clue.label,
      hint: clue.clue.replace('_', '\\_'),
      answer: answer
    });
  }
  return output;
}  

  async puzzleToLatex(puzzle: Puzzle): Promise<string> {
    const template = await this.httpClient.get('assets/tex/template.tex.liquid', { responseType: 'text' }).toPromise();
    if (template == undefined) {
      throw new Error('template failed to load');
    }
    const puzzleTemplate = this.puzzleToTemplateData(puzzle, false);
    return await this.engine.parseAndRender(template, puzzleTemplate);
  }
}
