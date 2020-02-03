
const Marked = require('marked');
const utilities = module.exports = {};


Marked.setOptions({
  renderer: new Marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  smartLists: true,
  smartypants: false
});

//sanitize: true,


/**
	* does string start with test, temp before native support
	*
	* @param  {String} str
    * @param  {String} str
	* @return {Boolean}
	*/
utilities.startsWith = function (str, test) {

    return (str.indexOf(test) === 0);
};


/**
	* does string end with test, temp before native support
	*
	* @param  {String} str
    * @param  {String} str
	* @return {Boolean}
	*/
utilities.endsWith = function(str, test) {

    return str.indexOf(test, str.length - test.length) !== -1;
};


/**
	* coverts markdown to html for named properties of an object
	*
    * @param  {String} markdown
    * @param  {Boolean trimBlockWrap
	* @return String}
	*/
utilities.convertMarkdown = function( markdown, trimBlockWrap ){

    let html = Marked(markdown);
    if(trimBlockWrap && trimBlockWrap === true){
        html = utilities.trimMarkdown(html);
    }
    return html;
}


utilities.convertMarkdownProperties = function( obj, names, trimBlockWrap ){

    names.forEach(function(name){
        if(obj[name]){
            let value = Marked(obj[name]);
            if(trimBlockWrap && trimBlockWrap === true){
                value = utilities.trimMarkdown(value);
            }
            obj[name] = value;
        }
    })
    return obj;
}


utilities.trimMarkdown = function( markdown ){

    const start ='<p>';
    const end = '</p>\n'
    if(markdown && utilities.startsWith(markdown, start)){
        markdown = markdown.replace(start,'');
    }
    if(markdown && utilities.endsWith(markdown, end)){
        markdown = markdown.substring(0, markdown.length - end.length)
    }
    return markdown;
}