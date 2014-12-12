gulpFrontendMobileTasks
===================

## Updates
# 
** 2014.11.12 **

- 改變sass資料夾結構與預設檔案
- 修正retina-sprites.scss use-sprite()效能
- gulpfile.js  task "browser-sync" 新增監聽/test-js/**/*.html與/test-js/**/*.js


---
## 特色:
1. 整合mobile boilerplate
2. 整合sass
3. 可簡單的處理一倍兩倍圖的問題
4. 分開發與產品環境
5. 自動建立測試環境
---

## 執行模式: 

* `server`: 監聽sass/, 並在每次儲存自動轉成css檔案
* `live`: 同server, 但多了browser-sync模組, 在每次儲存sass時, 會自動重新整理瀏覽器中，網址為:localhost:3000/html.*.html的頁面
* `test`: 同live, 但在每次儲存html/與js/檔案時,會在test-html與test-js產生相對應的測試環境
* `dist`: 壓縮js/vendor，壓縮css/與合併css/global/裡所有css檔案成global.css
* `dist-img`: 結合`dist`與壓縮圖片, 通常用於第一次壓縮圖片(如果有新圖片, 就要重新執行以便重新壓縮圖片)

---
##資料夾結構
### 注意: 有*符號的項目請勿任意刪除
+ css/
	+ global/ (`要合併的css請放這`)
		+ *normalize.css (`reset用的css, 在合併時一律在所有合併檔案的最上面`)	
+ html/
+ js/
    + config/
      + *environments/ 
      	+ *development.js (`開發會用到的js變數`)
      	+ *production.js (`發佈會用到的js變數`)
      + *environment.js (`所有script都會用到的js變數`)
	+ lib/ (`自行開發的套件`)
	+ script/ (`html/每個html檔對應的js`)
	+ test/ (`測試所使用的套件, 目前使用mocha + chai`)
	+ vendor/ (`第三方套件`)
+ img/
	+ icons/ (`sprite icon 1倍圖放置位置, 變換位置需改sass/retina裡的設定`)
	+ icons-2x/ (`sprite icon 2倍圖放置位置, 變換位置需改sass/retina裡的設定`)
	+ startup/ (`web app startup圖放置處, 不需要可刪除`)
    + touch/ (`shortcut icon, apple-touch-icon等放置位置`)
+ sass/
	+ global/ (`產生後的css會放到css/global`)
	+ function/ (`共用的mixin, extend, variable等放在這`)
+ test-html/ (`html/產生的測試環境`)
	+ default.html (`測試用html樣板`)
 	+ default.js (`測試用js樣板`)
+ test-js/ (`js/產生的測試環境`)
	+ default.html (`測試用html樣板`)
	+ default.js (`測試用js樣板`)
+ favicon.ico (`favicon`)
+ gulpfile.js (`gulp腳本`)
+ humans.txt (`網站說明`)
+ robots.txt (`告知檢索器哪些網頁可以存取, 哪些不可存取`)
---
##測試環境結構

###html整合測試
假設在html/建立一個main.html檔案後按儲存

gulp會在test-html/產生以下檔案並在每次儲存會有以下機制:

```
1. 測試用html如果不存在會複製./default.html並產生, 如果存在則檔案會複製並覆蓋
2. 測試用js如果不存在則會複製./default.js並產生, 如果存在則不覆蓋, 避免測試的js程式碼不見
```

+ test-html/
	+ script/
		+ main.js (`測試html/main.html的測試碼`)
	+ main.html (`供測試並測試結果用的html, gulp將html/main.html複製一份並將測試用的css,js插入`)


###js單元測試
假設在js/script建立一個myScript.js檔案後按儲存

gulp會在test-js/產生以下檔案並在每次儲存會有以下機制:

```
1. 測試用html如果不存在會複製./default.html並產生, 如果存在則不覆蓋, 避免測試js用的html程式碼不見
2. 測試用js如果不存在則會複製./default.js並產生, 如果存在則不覆蓋, 避免測試的js程式碼不見
```

+ test-js/
	+ script/
		+ script/
			+ myScript.js (`測試js/script/myScript.js的測試碼`)
		+ myScript.html (`供測試並測試結果用的html`)



---
##Usage

### step1: download node modules
```
npm install or sudo npm install
```

### step2: execute grunt

```
gulp {command}, ex: gulp server, gulp dist

```

### step3: use & enjoy it! :)
如果為livereload模式, <br>
預設的網址為: localhost:3000, <br>
瀏覽器會自動重新整理瀏覽器中，網址為:localhost:3000/html.*.html的頁面

---
 
##License
Licensed under the MIT License
 
 ---
##Authors
Copyright(c) 2014 Hank Kuo <<hank7444@gmail.com>>
