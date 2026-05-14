export class OrderNumberGenerator {
    private static readonly PREFIX = 'TP';
    private static readonly LENGTH = 8;
    private static readonly NUMBER_LENGTH = 6;
  
    /**
     * Generates the next order number in the format TP000001
     * @param lastOrderNumber - The last order number in the database
     * @returns The next order number
     */
    static generateNextOrderNumber(lastOrderNumber?: string | null): string {
      if (!lastOrderNumber) {
        return `${this.PREFIX}000001`;
      }
  
      // Extract the numeric part from the last order number
      const numericPart = lastOrderNumber.replace(this.PREFIX, '');
      const nextNumber = parseInt(numericPart, 10) + 1;
      
      // Pad with zeros to maintain 6-digit format
      const paddedNumber = nextNumber.toString().padStart(this.NUMBER_LENGTH, '0');
      
      return `${this.PREFIX}${paddedNumber}`;
    }
  
    /**
     * Validates if an order number follows the correct format
     * @param orderNumber - The order number to validate
     * @returns True if valid, false otherwise
     */
    static isValidOrderNumber(orderNumber: string): boolean {
      if (!orderNumber || orderNumber.length !== this.LENGTH) {
        return false;
      }
  
      const prefix = orderNumber.substring(0, 2);
      const numericPart = orderNumber.substring(2);
  
      return prefix === this.PREFIX && /^\d{6}$/.test(numericPart);
    }
  
    /**
     * Extracts the numeric part from an order number
     * @param orderNumber - The order number
     * @returns The numeric part as a number
     */
    static extractNumber(orderNumber: string): number {
      const numericPart = orderNumber.replace(this.PREFIX, '');
      return parseInt(numericPart, 10);
    }
  }