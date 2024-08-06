import { Injectable, numberAttribute } from '@angular/core';
import { __values } from 'tslib';

const _START_SECTION = '!start';


export interface Puzzle {
  grid: Grid,
  clues: Clue[],
  title: string,
  author: string,
  labels: Map<number, string>
}


export interface Grid {
  grid: string[]
  width: number
  height: number
}

export interface Clue {
  clue: string
  answer: string
  label: string
  mapping: number[]
}


@Injectable({
  providedIn: 'root'
})
export class AcrFormatService {

  constructor() { }

  private parseSection(line: string): [string, boolean] {
    const trimmed = line.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      return [trimmed.substring(1, trimmed.length - 1).toLowerCase(), true];
    }
    return ["", false];
  }

  private parseSections(file: string): Map<string, string[]> {
    let lineNum = 0;
    const sections = new Map<string, string[]>()

    let currentSection: string[] = []
    sections.set(_START_SECTION, currentSection)
    for (var split of file.split(/\r?\n/)) {
      lineNum++;
      const trimmed = split.trim();
      if (trimmed == "") {
        continue;
      }
      const line = { number: lineNum, contents: split }
      let [sectionTitle, ok] = this.parseSection(trimmed)
      if (ok) {
        currentSection = []
        sections.set(sectionTitle, currentSection)
      } else {
        currentSection.push(trimmed)
      }
    }
    return sections
  }

  private parseClues(lines: string[]): Clue[] {
    if (lines.length % 3 != 0) {
      throw new Error(`keywords section ended unexpectedly after ${lines.length} lines`);
    }
    if(lines.length > 26 * 3) {
      throw new Error('Too many clues -- only 26 are supported');
    }
    // A. Having a rose-like pattern
    // ROSEATE
    // 171 120 124 140 112 113 87
    const clues: Clue[] = []
    let label = 'A'
    for (let i = 0; i < lines.length; i += 3) {
      const clue = lines[i];
      if (clue[0].toLowerCase() != label.toLowerCase()) {
        throw new Error(`Expected clue ${clue} to begin with ${label}`);
      }
      const clueNoLabel = clue.replace(/[a-zA-Z][.]?/, '').trim();
      const answer = lines[i + 1];
      const mapping = lines[i + 2].split(/\s+/).map((x) => +x);
      for (const v of mapping) {
        if (Number.isNaN(v)) {
          throw new Error(`found unparseable value when reading mappping of ${clue}`);
        }
      }
      if (answer.length != mapping.length) {
        throw new Error(`Answer ${answer} and mapping ${mapping} have lengths ${answer.length} != ${mapping.length}`)
      }
      // Increment label
      label = String.fromCharCode(label.charCodeAt(0) + 1);
      clues.push({
        clue: clueNoLabel,
        answer: answer,
        label: label,
        mapping: mapping,
      })
    }
    return clues
  }

  private parseGrid(lines: string[]): Grid {
    const height = lines.length;
    const width = lines[0].length;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].length != width) {
        throw new Error(`Line ${j + 1} of has length ${lines[j].length} != ${width}`);
      }
    }
    return {
      grid: lines,
      width: width,
      height: height,
    }
  }

  private parseAuthor(author: string): string {
    return author.replace(/by/, '').trim();
  }

  private getOneLine(sections: Map<string, string[]>, section: string, fallback: string) {
    const lines = sections.get(section);
    if (lines == undefined) {
      return fallback
    }
    if (lines.length != 1) {
      throw new Error(`unexpected section length ${section}: ${lines.length}`)
    }
    return lines[0];
  }

  private validateAndGenerateLabels(puzzle: Puzzle): Puzzle {
    let characters = 0;
    for (const line of puzzle.grid.grid) {
      for (const char of line) {
        if (char != '#') {
          characters++;
        }
      }
    }
    for (const clue of puzzle.clues) {
      for (const index of clue.mapping) {
        const already = puzzle.labels.get(index)
        if (already != undefined) {
          throw new Error(`index ${index} appeared in clue ${already} and ${clue.label}`)
        }
        puzzle.labels.set(index, clue.label)
      }
    }
    if (characters != puzzle.labels.size) {
      throw new Error(`found ${characters} letters in grid and ${puzzle.labels.size} in clues`);
    }
    for (const [index, label] of puzzle.labels) {
      if (index < 1 || index > characters) {
        throw new Error(`label ${label} has index ${index} which is out of range [1, ${characters}]`)
      }
    }
    return puzzle
  }


  parseFile(file: string): Puzzle {
    const requiredSections = ['grid', 'keywords', _START_SECTION]
    const sections = this.parseSections(file)
    for (const rs of requiredSections) {
      if (!sections.has(rs)) {
        throw new Error(`file missing required section '${rs}'`);
      }
    }
    const start = this.getOneLine(sections, _START_SECTION, "")
    if (start != "! This file made by Acrostic 3.0 program. DO NOT EDIT!") {
      throw new Error('Missing magic header string');
    }
    const title = this.getOneLine(sections, "title", "Untitled");
    const author = this.parseAuthor(this.getOneLine(sections, "byline", "by Anonymous"))
    const grid = this.parseGrid(sections.get("grid")!);
    const clues = this.parseClues(sections.get("keywords")!);
    const puzzle = {
      grid: grid,
      clues: clues,
      title: title,
      author: author,
      labels: new Map<number, string>()
    }
    return this.validateAndGenerateLabels(puzzle)
  }
}
