import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';
import { load } from 'cheerio';

const link = 'http://www.jwc.zjut.edu.cn';
const host = 'http://www.jwc.zjut.edu.cn/1849/list.htm';

const getSingleRecord = async () => {
    const res = await got(host);

    const $ = load(res.data);
    const list = $('.list2').find('li');

    return (
        list &&
        list
            .map((index, item) => {
                item = $(item);
                const dateTxt = item.find('.news_meta').text();
                const link_txt = item.find('a').attr('href');
                const title_txt = item.find('a').attr('title');
                return link_txt.startsWith('http')
                    ? {
                          title: title_txt,
                          pubDate: parseDate(dateTxt),
                          link: link_txt,
                      }
                    : {
                          title: title_txt,
                          pubDate: parseDate(dateTxt),
                          link: link + link_txt,
                      };
            })
            .get()
    );
};

export const route: Route = {
    path: '/jwc',
    categories: ['university'],
    example: '/zjut/jwc',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '浙工大教务处 教学通知',
    maintainers: ['kar1n1911'],
    handler,
    url: 'www.jwc.zjut.edu.cn/1849/list.htm',
    radar: [
        {
            source: ['www.jwc.zjut.edu.cn/1849/list.htm'],
        },
    ],
};

async function handler() {
    const items = await getSingleRecord();
    const out = await Promise.all(
        items.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await got(item.link);
                const $ = load(response.data);
                return {
                    title: item.title,
                    link: item.link,
                    description: $('.wp_articlecontent').html(),
                    pubDate: item.pubDate,
                };
            })
        )
    );
    return {
        title: '浙工大教务处 教学通知',
        description: '浙江工业大学-通知公告',
        link: host,
        item: out,
    };
}
