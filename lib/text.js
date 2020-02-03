
const Utilities = require('../lib/utilities');


const text = module.exports = {};


text.inject = function(waypointer, settings){

    if(settings.text){
        settings.text.forEach(function(textItem){
            if(textItem.path){
                text.injectPathObj(waypointer, textItem);
            }
            if(textItem.group){
                text.injectGroupObj(waypointer, textItem);
            }
            if(!textItem.path && !textItem.group){
                text.injectAPIObj(waypointer, textItem);
            }
        });
    }
}

text.injectGroupObj = function(waypointer, textObj){

    let group;
    let i = waypointer.groups.length;
    while (i--) {
        if(waypointer.groups[i].name === textObj.group){
            group = waypointer.groups[i];
            break;
        }
    }
    text.injectBlockj(group, textObj, textObj.path);
}


text.injectPathObj = function(waypointer, textObj){

    let group;
    let endpoint;
    let i = waypointer.groups.length;
    while (i--) {
        group = waypointer.groups[i]
        let x = group.endpoints.length;
        while (x--) {
            if(textObj.path === group.endpoints[x].path){
                endpoint = group.endpoints[x];
                break;
            }
        }
    }
    text.injectBlockj(endpoint, textObj, textObj.path);
}


text.injectAPIObj = function(waypointer, textObj){

    text.injectBlockj(waypointer, textObj, 'API');
}



text.injectBlockj = function(waypointerObj, textObj, name){
    if(waypointerObj){
        if(!waypointerObj.text){
            waypointerObj.text = {};
        }
        textObj.text.forEach(function(textItem){
            if(!waypointerObj.text[textObj.place]){
                waypointerObj.text[textObj.place] = [];
            }
            let blockObj = {
                html: Utilities.convertMarkdown( textItem.markdown, false )

            }
            if(textItem.class){
                blockObj.class = textItem.class;
            }
            if(textItem.name){
                blockObj.name = textItem.name;
                blockObj.id = text.label(name, textItem.name);
            }
            waypointerObj.text[textObj.place].push(blockObj);
        });
    }else{
        console.log(name, 'Not found');
    }
}


text.label = function(parentName, name){

    return (parentName + '-' + name).toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
}