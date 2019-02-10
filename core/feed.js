const RssParser = require('rss-parser')
const { buffer } = require('../lib')
const { scheduleJob } = require('node-schedule')
const { parseURL } = new RssParser({
  // customFields: {
  //   item: [
  //     'nyaa:seeders',
  //     'nyaa:leechers',
  //     'nyaa:downloads',
  //     'nyaa:infoHash',
  //     'nyaa:categoryId',
  //     'nyaa:category',
  //     'nyaa:size',
  //     'description',
  //     'guid'
  //   ]
  // }
})
const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout))

const feed = {
  items: [],
  feedUrl: 'https://mangadex.org/rss/QdYsWk7gUenfr2K5cpwzXF8maZMyPR3h',
  title: 'MangaDex RSS',
  description: 'The latest MangaDex releases',
  link: 'https://nyaa.si/'
};

(async () => {
  const data = await loadFeed()
  feed.items = data.items.map(el => el.id)
})()

async function loadFeed () {
  const data = await parseURL('https://mangadex.org/rss/QdYsWk7gUenfr2K5cpwzXF8maZMyPR3h')
  // console.log(data)
  data.items.forEach(el => {
    el.id = Number.parseInt(el.guid.split('/').pop())
  })
  return data
}

module.exports = bot => {
  const { telegram } = bot

  scheduleJob('*/1 * * * *', async () => {
    const newFeed = await loadFeed()
    const newPosts = newFeed.items.filter(el => !feed.items.includes(el.id)).reverse()
    feed.items = newFeed.items.map(el => el.id)
    if (newPosts.length) {
      for (const post of newPosts) {
        await sendMessage(post)
        await sleep(1500)
      }
    }
  })

  async function sendMessage (post) {
    const hashtags = getHashtags(post.content)
    const title = parseTitle(post.title)
    let messageText = `<a href="${post.link}">&#8203;</a><b>${title.title}</b>\n`
    messageText += `<b>${title.volume ? `Volume ${title.volume}, ` : ''}Chapter ${title.chapter}</b> in ${hashtags.lang}\n`
    messageText += `<a href="${post.guid}">View</a>\n`
    await telegram.sendMessage(process.env.CHANNEL_ID, messageText, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Read chapter',
              url: `https://t.me/${bot.options.username}?start=${buffer.encode(`chapter:${post.id}`)}`
            }
          ]
        ]
      },
      disable_web_page_preview: true
    })
  }
}

function getHashtags (content) {
  const groupMatch = content.match(/Group: (\S+)/i)
  const uploaderMatch = content.match(/Uploader: (\S+)/i)
  const langMatch = content.match(/Language: (\S+)/i)

  return {
    group: groupMatch ? groupMatch[1] : '',
    uploader: uploaderMatch ? uploaderMatch[1] : '',
    lang: langMatch ? langMatch[1] : 'English'
  }
}

function parseTitle (title) {
  let volumeMatch = title.match(/Volume (\S+)/i)
  return {
    title: title.match(/(.+?) - /i)[1],
    volume: volumeMatch ? volumeMatch[1] : undefined,
    chapter: title.match(/Chapter (\S+)/i)
  }
}
