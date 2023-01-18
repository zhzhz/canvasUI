// export function xml2js(file:String) {
//     var convert = require('xml-js');
//     var xml = require('fs').readFileSync(file, 'utf8');
//     var options = {ignoreComment: true, alwaysChildren: true};
//     var result = convert.xml2js(xml, options); // or convert.xml2json(xml, options)
//     //console.log(result);
//     return result;
// }

export function xml2js(file:string) {
    const convert = require('xml-js');
    const xml = require('fs').readFileSync(__dirname + '\\..\\src\\xml\\'+ file, 'utf8');
    const options = {ignoreComment: true, alwaysChildren: true};
    const result = convert.xml2js(xml, options); // or convert.xml2json(xml, options)
    return result;
}