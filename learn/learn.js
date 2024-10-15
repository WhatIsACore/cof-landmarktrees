'use strict';

const $ = e => document.querySelector(e);
const $$ = e => document.querySelectorAll(e);

fetch('articles.json').then(res => res.json()).then(json => {
    let html = ``;
    for (let article of json)
        html += `
            <div class='learn-explore-article'>
                <div class='article-thumbnail' style='--source: url("${article.thumbnail}")'></div>
                <div class='article-subtitle'>${article.tag}</div>
                <div class='article-title'>${article.title.replace(/\s(?!\S*\s)/, '&nbsp;')}</div>
            </div>
        `;
    $('.learn-explore-grid').innerHTML = html;
});