import Telegraf, { TelegrafContext } from 'telegraf'
import { resolve } from 'path'
import logger from './logger'
const TelegrafI18n = require('telegraf-i18n')

export const bot = new Telegraf<TelegrafContext>(process.env.TOKEN)

export const localesPath = resolve(__dirname, '..', 'locales')

export const i18n = new TelegrafI18n({
  defaultLanguage: 'en',
  allowMissing: false, // Default true
  directory: localesPath
})

bot.use(i18n.middleware())

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

if (process.env.DEV) {
  bot.use(async (ctx, next) => {
    const startTime = Date.now()
    await next()
    const endTime = Date.now()
    console.log(
      `update ${ctx.update.update_id} processed in ${endTime - startTime} ms`
    )
  })
}

bot.use(logger)

bot.startPolling()
