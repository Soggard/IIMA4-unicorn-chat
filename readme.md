## Chatt


# Setup

Install /node_modules
```bash
yarn install
```

Launch nodejs
```bash
yarn start
```

## Events

## Server

**chat.join*

```js
{
    "username": "John Doe"
}
```

**chat.typing*

```js
{
    "username": "John Doe"
}
```


**chat.message*

```js
{
    "username": "John Doe"
    "message": "Lorem ipsum..."
}
```


**chat.message*

```js
{
    "salon": "ABC"
}
```

## Client

**chat.join*

```js
{
    "username": "John Doe"
}
```

**chat.room*

```js
```

**chat.typing*

```
```


**chat.message*

```js
{
    "message": "Lorem ipsum..."
}
```