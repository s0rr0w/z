z
=

Z (Zet) Framework - HTML/JS реактор для построения одностраничных приложений

 > -- Программируй UI без использования JS!  
 > -- Это как? o_O

Примеры можно постмотреть тут: http://s0rr0w.github.io/z/examples

---

## Оглавление

* [Введение](#Введение)
* [Подключение](#Подключение)
* [События](#События)
* [Вызов событий](#Вызов-событий)
* [Обработчики](#Обработчики)
* [Темплейтирование](#Темплейтирование)

---

### Введение

Как и любой реактор, данный фреймворк оперирует следующими сущностями: обработчик события (handler), диспатчер (dispatcher) и событие (event). Диспатчер запускает именованое событие, которое потом обрабатывается какими-то обработчикам. На этом построена вся логика фреймворка, и именно на этом принципе строится весь UI. Без MVC, без модулей, без роутеров и без JS кода.

---

### Подключение

Вам потребуется подключить всего два файла
```html
<script type="text/javascript" src="z.js"></script>
<script type="text/javascript" src="z_handlers.js"></script>
```
Где:
* `z.js` -- код самого фреймворка
* `z_handlers.js` -- код обработчиков, которые используются в вашем проекте (аналог расширений или плагинов в других фреймворках)

---

### События

События Z фреймворка очень похожи на DOM-события, но их распространение в DOM-дереве принципиально отличается. Z-событие распространяется от какого-то контейнера и, при определенных условиях, на определенные элементы внутри. Эта зона видимости указывается непосредственно при запуске события и не зависит от наличия или отсутствия обработчика на каком-либо элементе. 

События бывают двух типов: локальные и глобальные. Локальные события имеют локализацию зоны распространения события определенным контейнером. Глобальные события работают в рамках всего документа, и срабатывают только на элементах, которым добавлены глобальные обработчики. Основное предназначение глобальных событий - рендеринг данных, которые присылаются с сервера, или одновременная модификация распределенных по всему DOM-дереву элементов (аналог data-binding)

Фреймворк не содержит методов остановки распространения событий (stopPropagation), так как на практике эта функциоальность не нужна. Данная "проблема" спокойно решается путем изменения зоны распространения события или дополнительной функцональностью обработчиков. 

#### Структура `zEvent`

```javascript
{
  e: "eventName",
  t: targetNode,
  f: containerNode,
  p: "propagation",
  data: JSON || Object,
  [b: isBroadcastedEvent,]
  [use: "dispatcherID"]
}
```
Где: 

* `e` -- имя события  
* `t` -- ссылка на элемент, который был __инициатором__ события  
* `f` -- ссылка на элемент, с которого начнется распространяться событие  
* `p` -- директивы распространения события  
* `data` -- данные, которые передаются вместе с событием  
* `b` -- признак того, что событие было переадресовано дочерним элементам  
* `use` -- ссылка на реальный диспатчер события  

---

### Вызов событий

Существует четыре способа запуска событий:

1. Директива `<dispatch>` [»»»](#Директива-dispatch)
2. Удаленный вызов `<dispatch>` директивы [»»»](#Удаленный-вызов-dispatch-директивы)
3. JS-метод `z.dispatch()` [»»»](#js-метод-zdispatch)
4. JS-метод `z.dispatchById()` [»»»](#js-метод-zdispatchbyid)

[Интерактивный пример](http://s0rr0w.github.io/z/examples/6/) наглядно продемонстрирует логику работы диспатчера событий.

#### Директива `<dispatch>`

Данная директива носит __описательный__ характер и __не запускает__ событие. Реальным инициатором запуска могут быть директивы `<exec/>` или `<handler/>`, которые будут описаны ниже.

##### Формат
```html
<dispatch e="eventName" [f="cotainerNode"] [p="propagation"] [id="dispatchID"]>[{ JSON Object }]</dispatch>
```
Где: 

* `e` -- имя события  
* `f` -- контейнер, с которого начинать распространение события  
* `p` -- директивы распространения события  
* `id` -- идентификатор диспатчера
* `{ JSON Object }` -- объект с данными, который будет путешествовать вместе с событием

Атрибуты `f`, `p`, `id` и `{ JSON Object }` являются не обязательными

###### Имя события `e[vent]`

Имя события должно удовлетворять правилам именования переменных JS, значения атрибутов и названию тегов.

_Примеры названий_
```
click, myCoolEvent2, Do_It_Again
```

###### Контейнер распространения события `f[rom]`

Параметр может принимать следующие значения:

* `#id` -- идентификатор ноды  
* `.className` -- имя класса первого из вышестоящих родительских элементов  
* `tagName` -- имя первого из вышестоящих элементов

По умолчанию, если параметр не задан, в качестве контейнера будет взят родительский элемент тега `<dispatch>`

Для __глобальных__ событий данный параметр __игнорируется__

_Например_
```html
<body>
  <header class="superClass">
    <div class="superClass">
      <dispatch e="e1" f="#pageFooter"></dispatch>
      <dispatch e="e2" f=".superClass"></dispatch>
      <dispatch e="e3" f="header"></dispatch>
      <dispatch e="e4"></dispatch>
    </div>
  </header>
  <footer id="pageFooter">
  </footer>
</body>
```

Событие `e1` начнет свое распространение с `footer#pageFooter`, события `e2` и `e4` с `div.superClass` (первый родительский элемент, который удовлетворяет условиям), а событие `e3` с тега `header`



###### Директивы распространения события `p[ropagation]`

Доступны следующие варианты директив:

* `global` -- событие является глобальным, распространяется только среди елементов с глобальными обработчиками
* `parent` -- распространяется исключительно на контейнере, описанном в атрибуте `f`
* `childNodes` -- распространяется на прямых потомках контейнера
* `nodeName` -- на дочерних элементах с данным именем тега
* `.className` -- на дочерних элементах с данным классом
 
По умолчанию событие распространяется на все элементы внутри контейнера, в том числе и на те, которые были только что созданы при помощи темплейт системы. Это может быть причиной деградации скорости работы. 
 
Директивы `global` и `parent` являются исключительными и их использование допускается только в единичном виде. Все остальные директивы можно записывать через запятую. 

Зона распространения события для неглобальных событий всегда идет в следующем порядке: сначала событие отправляется родительскому контейнеру, а потом уже тем элементам, которые указаны в списке директив. Элементы перебираются вне зависимости от того, есть там обработчик, или нет.

__Важно!__ При том, что директивы перебираются в прямом порядке (в том, в котором они указаны в списке), сами элементы перебираются __в обратном__!

_Например_
```html
<body>
  <dispatch e="e1" p="global"></dispatch>
  <dispatch e="e2" p="parent"></dispatch>
  <dispatch e="e3" p="childNodes,span"></dispatch>
  <dispatch e="e4" p="li,span,.newItem"></dispatch>
  <ul>
    <li>Item <span>1</span></li>
    <li>Item <span>2</span></li>
    <li class="newItem">Item <span>3</span></li>
  </ul>
</body>
```

Событие `e1` глобальное, а так как мы не зарегистрировали ни одного соответствующего обработчика, то событие не будет распространяться ни на один из тегов.

В зону видимости события `e2` попадет только тег `body`.  

У события `e3` зона распространения будет следующая:

* `body` как родительский контейнер диспатчера
* `ul` как дочерний элемент (`childNodes`) контейнера
* 3 тега `span`

У события `e4` зона распространения события будет следующая:

* `body` как родительский контейнер диспатчера
* 3 тега `li`
* 3 тега `span`
* `li.newItem` повторно попадает в зону видимости

###### Объект с данными

Содержимое тега `<dispatch>` сначала интерпретируется с помощью встроенной темплейт системы, а уже потом результат в виде текстового содержимого парсится как JSON-объект. 

Допускается пустое значение тега `<dispatch>`, в данном случае у события поле `data` будет равно пустому JSON-объекту.

_Пример использования_
```html
<dispatch e="e1">{ "x": 1 }</dispatch>
<dispatch e="e2">{ "x": <value>someX</value> }</dispatch>
```

Событие `e1` будет содержать поле `data`, равное JSON-объекту `{ "x": 1 }`, а событие `e2` - результат замещения тега `<value>` на значение переменной `someX`, а потом уже получившемуся JSON-объекту.

#### Удаленный вызов `<dispatch>` директивы

Данная инструкция позволяет удаленно вызывать диспатчер по `id`. 

##### Формат
```html
<dispatch use="dispatcherID">[{ JSON Object }]</dispatch>
```
Где: 

* `use` -- идентификатор ноды `<dispatch>`

###### Объект с данными

Если JSON-объект определен, то событие будет запущено именно с этим объектом. Фактически, мы переопределяем данные удаленного диспатчера. Если JSON-объек не определен, то будут использованы данные удаленного диспатчера

_Например_
```html
<dispatch e="e1" id="farDispatcher1">{ "x": 1 }</dispatch>
<dispatch e="e2" id="farDispatcher2"></dispatch>

<exec>
<!-- 1 --><dispatch use="farDispatcher1">{ "x": 2, "y": 3 }</dispatch>
<!-- 2 --><dispatch use="farDispatcher1"></dispatch>

<!-- 3 --><dispatch use="farDispatcher2">{ "x": 2, "y": 3 }</dispatch>
<!-- 4 --><dispatch use="farDispatcher2"></dispatch>
</exec>
```

1. Будет вызван `dispatch#farDispatcher1`, который запустит событие `e1`, которое будет содержать данные `{ "x": 2, "y": 3 }`
2. Будет вызван тот же диспатчер, но данные будут те, которые определены первоначально: `{ "x": 1 }`
3. Результат будет аналогичный пункту 1, только с другим именем события
4. Данные события `e2` будут пустыми (`{}`)


#### JS-метод `z.dispatch()`

Данный метод позволяет запускать события [zEvent](#Структура-zevent)

##### Формат
```javascript
z.dispatch(zEvent[,zEvent,...]);
```

_Пример использования_
```javascript
z.dispatch(
 {
  e: "e1", 
  f: document.getElementById("container"),
  p: "childNodes",
  data: { "x": 1 }
 },
 {
  e: "e2",
  p: "global"
 }
)
```

#### JS-метод `z.dispatchById()`

Данный метод является аналогом удаленного вызова директивы `<dispatch>`, за исключением того, что данные не замещаются, а __добавляются__ к существующим.

##### Формат
```javascript
z.dispatchById( "dispatcherID"[, mixinData ] );
```

Где
* `dispatcherID` -- идентификатор ноды `<dispatch>`
* `mixinData` -- объект данных, который будет __добавлен__ к существующим данным 

---

### Обработчики

Во фреймворке в качестве обработчиков выступают примитивные JavaScript-функции. Следуя идеологии *nix-way, они должны выполнять одну функцию, но делать это наилучшим образом. 

* Установка обработчиков `<e>` [»»»](#Установка-обработчиков-e)
* Регистрация обработчиков `z.addHandler` [»»»](#Регистрация-обработчиков-zaddhandler)

#### Установка обработчиков `<e>`

Данная директива устанавливает обработчик родительской ноде

##### Формат
```html
<e [global] on="eventName" do="handlerAlias">[params]</e>
```
Где: 

* `global` -- признак глобального обработчика
* `on="eventName"` -- имя события, по которому будет срабатывать обработчик
* `do="handlerAlias"` -- имя функции-обработчика, которая будет выполнена
* `params` -- дополнительные параметры, которые будут переданы функции-обработчику, в формате `param1,param2,...,paramN`

Например, мы хотим, чтобы тег `<body>` реагировал на события `setLayout`, добавляя класс `modal`

```html
<body>
  <e on="setLayout" do="addClass">modal</e>
</body>
```

#### Регистрация обработчиков `z.addHandler`

Фреймворк в качестве обработчиков воспринимает только те функции, которые были предварительно зарегистрированы через интерфейс `z.addHandler`

##### Формат
```javascript
z.addHandler("handlerAlias", function(eventObject,passedParams){});
```
Где: 

* `handlerAlias` -- имя функции-обработчика
* `function` -- ссылка на функцию
* `eventObj` -- объект события `zEvent`
* `passedParams` -- массив дополнительных параметров, которые были указаны для установщика обработчика `<e>`

__Внимание!__ Ключевое слово `this` в функции-обработчике будет ссылаться на ноду, которой был установлен данный обработчик

_Пример использования_
```javascript
z.addHandler("addClass", function(e, data){
 if (data[0]) this.classList.add(data[0]);
});
```
Если обработчики были следующими
```html
<e on="setLayout" do="addClass">modal</e>
<e on="setLayout" do="addClass">myClass</e>
```
то значение `data[0]` для вызова первого обработчика `addClass` будет равно `modal`, а для второго уже `myClass`


---

### Темплейтирование
