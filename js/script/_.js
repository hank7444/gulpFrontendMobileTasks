// 因為gulp-watch只要資料夾沒檔案會導致之後修改新增檔案都不會觸發
// 所以寫一個_.js來觸發, 如果資料夾有檔案後就可以將此js刪除
// bug report: https://github.com/shama/gaze/pull/103