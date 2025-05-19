/**
 * Creates a deterministic pseudo-random number generator
 * @param seed The seed value
 * @returns A function that returns a random number between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
    return function() {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }
  
  /**
   * Converts a string to its binary representation
   * @param str The input string
   * @returns Binary representation as a string of 0s and 1s
   */
  export function stringToBinary(str: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const binary = str.charCodeAt(i).toString(2).padStart(8, '0');
      result += binary;
    }
    return result;
  }
  
  /**
   * Converts a binary string back to a regular string
   * @param binary The binary string (must be a multiple of 8 in length)
   * @returns The decoded text
   */
  export function binaryToString(binary: string): string {
    let result = '';
    for (let i = 0; i < binary.length; i += 8) {
      const byte = binary.substring(i, i + 8);
      result += String.fromCharCode(parseInt(byte, 2));
    }
    return result;
  }