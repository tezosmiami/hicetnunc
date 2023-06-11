import { Buffer } from 'buffer'
import Process from 'process'

globalThis.Buffer = Buffer
globalThis.process = Process
globalThis.global = globalThis