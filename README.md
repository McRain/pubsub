# pubsub
```
const EventPub = require("@reneos/pubsub").EventPub
```

## To subscribe to events, use :

```
const key = EventPub.Subscribe("my.path.sub",(data,path)=>{
  console.log(`On Publicate ${data.anyprop} `)
})
```

## A subscription with an empty path will receive all events

## To publish events, use :

```
EventPub.Publish("my.path",{anyprop:'anydata'})
```

## Events will be published all the way, for example:
### If you published an event along the path "my.path.sub" then the publication will be along the path "my.path.sub" and along the path "my.path" and "my"
