import {randomInt} from "node:crypto";
import fs from "node:fs";
import fetch from "node-fetch";
import {parse} from "node-html-parser";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const header = [
  "name",
  "url",
  "saiten_人気",
  "saiten_実績",
  "saiten_価格",
  "jisseki",
  "compare_対応言語",
  "compare_対応サーバー環境・DB",
  "compare_人月例「エンジニアの料金例.(円)」",
  "compare_得意サイト・システム",
  "compare_会社特色",
  "compare_会社規模「社員数.(人)」",
  "compare_得意業界",
];

const csv = [header.join(",")];

for (const index of new Array(100).keys()) {
  console.log(`page: ${index * 10}`);
  await fetch(`https://www.biz.ne.jp/list/web-system/?datacnt=${index * 10}`)
  .then((res) => res.text())
  .then((body) => {
    const root = parse(body);
    for (const li of root.querySelectorAll("ul.result_area li")) {
      const name = li.querySelector("div.right_box h3")?.innerText;
      if (!name) {
        continue;
      }
      const resultOutline = li.querySelector("div.result_outline");
      const url = resultOutline
      .querySelector("div.tl a")
      .getAttribute("href");
      const saiten = {};
      for (const saitenEl of resultOutline.querySelectorAll(
          "ul.saiten_area li",
      )) {
        saiten[`saiten_${saitenEl.querySelector("span.tl").innerText}`] =
            saitenEl.querySelector(".en.num")?.innerText;
      }
      const jisseki = resultOutline
      .querySelector("ul.ct_sub")
      .innerText.match(/実績\((\d+)\)/)?.[1];

      const compare = {};
      for (const compareArea of li.querySelectorAll(".compare_area li")) {
        compare[
            `compare_${compareArea.querySelector("dt").innerText.replaceAll(
                "\n", "").trim()}`
            ] = compareArea
        .querySelector("dd")
        .innerText.replaceAll("\n", " ")
        .trim();
      }

      const resultMap = {name, url, ...saiten, jisseki, ...compare};
      const row = header.map((key) => resultMap[key]);
      csv.push(row.join(","));
    }
  });
  console.log(csv.length);
  await sleep(randomInt(1000, 3000));
}
fs.writeFileSync("hikaku-biz.csv", csv.join("\n"));
