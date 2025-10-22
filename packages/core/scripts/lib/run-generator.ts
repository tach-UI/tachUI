import { resolve } from 'node:path'

export function runGenerator(executableArgs: string[], tsconfig: string) {
  return ['tsx', '--tsconfig', tsconfig, ...executableArgs]
}

export const defaultTypegenTsconfig = resolve(__dirname, '..', 'tsconfig.typegen.json')
