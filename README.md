# simpleChatik

Простой приватный чат с регистраций и авторизаций.

Вообще это было тз по которому меня взяли, но я сам решил уйти из за того что там был ужасный код в один файл без какого либо ООП.
Вот пример кода из чего состоял весь проект и почему я принял решения сьебаться.

```js
    let FileName = "image" + Math.floor(Math.random() * 1000000000) + ".png";
    let check = 0;
    fs.writeFile('img/' + FileName, img, { encoding: 'base64' }, function (err) {
        if (err) console.log(err);
        check = 1;
    });
    while (check == 0) await timeout(100);
    return FileName;
```
