const fs = require('fs');
const showdown = require('showdown');
const showdownHighlight = require("showdown-highlight");

const videoRegex = /<!-- video::: (.*?) -->/g;

showdown.extension('custom-header-id', function () {
  var rgx = /^(#{1,6})[ \t]*(.+?) *\{: *#([\S]+?)\}[ \t]*#*$/gmi;
  
  return [{
    type: 'listener',
    listeners: {
      'headers.before': function (event, text, converter, options, globals) {
        text = text.replace(rgx, function (wm, hLevel, hText, hCustomId) {
          // find how many # there are at the beginning of the header
          // these will define the header level
          hLevel = hLevel.length;
          
          // since headers can have markdown in them (ex: # some *italic* header)
          // we need to pass the text to the span parser
          hText = showdown.subParser('spanGamut')(hText, options, globals);
          
          // create the appropriate HTML
          var header = '<h' + hLevel + ' id="' + hCustomId + '">' + hText + '</h' + hLevel + '>';
          
          // hash block to prevent any further modification
          return showdown.subParser('hashBlock')(header, options, globals);
        });

        // return the changed text
        return text;
      }
    }
  }];
});

const converter = new showdown.Converter({
    extensions: [
        // 'custom-header-id',

        showdownHighlight({
            pre: false,
            auto_detection: true
        })
    ]
});

// converter.setOption('noHeaderId', true);
converter.setOption('ghCompatibleHeaderId', true);
converter.setOption('omitExtraWLInCodeBlocks', true);
converter.setOption('openLinksInNewWindow', true);

const remove = (text, tokens = ['<!-- rem -->', '<!-- /rem -->']) => {
  let out = text;
  let c = 0;

  const [sToken, eToken] = tokens;

  while ( out.indexOf(sToken) !== -1 ) {
    c++;

    const start = out.indexOf(sToken);
    const end = out.indexOf(eToken) + eToken.length;

    out = `${out.slice(0, start)}${out.slice(end)}`;

    if (c > 40) {
      break;
    }
  }

  return out;
}

const extract = (text, tokens) => {
  const [sToken, eToken] = tokens;

  const start = text.indexOf(sToken);
  const end = text.indexOf(eToken);

  if (start !== -1 && end !== -1) {
    return text.slice(start + sToken.length, end).trim();
  }

  return '';
}

const video = (text) => {
  return text.replace(videoRegex, (_, json) => {
    const data = JSON.parse(json);

    return `<div class="_video"><span data-action="play-video" data-url="${data.url}"></span><img data-action="play-video" loading="lazy" data-url="${data.url}" src="${data.thumb}" alt="" /></div>`;
  });
}

const getVideos = (text) => {
  const videos = [];

  text.replace(videoRegex, (_, json) => {
    videos.push(JSON.parse(json));
  });

  return videos;
}

const pre = `<pre class="__code"><div><span></span><span></span><span></span><textarea></textarea><button data-action="copy-code">Copy</button></div>`;

const mdToHTML = ({ md, target = false, type = 'file' }) => {
  let html;
  let content;
  let videos;

  content = type === "file" ? fs.readFileSync(md).toString() : md;
  content = remove(content);
  videos  = getVideos(content);

  html = converter.makeHtml(content);
  html = html.replace(/<pre>/g, pre);

  const toc = extract(html, ['<!-- toc -->', '<!-- /toc -->']);

  html = remove(html, ['<!-- toc -->', '<!-- /toc -->']);
  html = video(html);

  const result = {
    html,
    toc,
    videos: {
      have: videos.length > 0,
      items: videos,
    },
  };

  if (target) {
    return fs.writeFileSync(target, JSON.stringify(result));
  }

  return result;
}

module.exports = mdToHTML;

/**
 * CUSTOM HEADER ID
-----------------------------------------------------------
## Heading Text {: #custom-id}
*/