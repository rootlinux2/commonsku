/// <reference types="node" />
import type { Process } from 'node:process';

declare global {
  const process: Process;
  const console: Console;
}

export {};
