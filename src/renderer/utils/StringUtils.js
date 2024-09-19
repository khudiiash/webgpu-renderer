class StringUtils {
  static capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
    
  static structToString(name, struct) {
    let structString = `struct ${StringUtils.capitalize(name)} {\n`;
    Object.entries(struct).forEach(([name, type]) => {
        structString += `    ${name}: ${type},\n`;
    })                   
    structString += '}\n';
    return structString;
  }
    
}

export { StringUtils };