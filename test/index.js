const EventPub = require("../eventpub")
const assert = require('assert')

const _netIdOne ="netIdOne",_netIdTwo="netIdTwo"

describe('Tests', () => {
    beforeEach((done) => {
        EventPub.Clean()
        done()    
    });
    describe('Single', () => {
        it('Subscribe', (done) => {
            EventPub.Subscribe("demo.path",({value})=>{})
            done()
        });
        it('Subscribe with own key', (done) => {
            const k = EventPub.Subscribe("demo.path",({value})=>{                
            },"DemoSubKey")
            done(assert.equal(k,"DemoSubKey"))
        });
        it('Subscribe and publish', (done) => {
            EventPub.Subscribe("demo.path",({value})=>{
                done(assert.equal(value,true))
            })
            EventPub.Publish("demo.path",{
                value:true
            })
        });
        it('Subscribe and publish partial path', (done) => {
            const result =  {
                "demo":false,
                "demo.path":false,
                "demo.path.test":false
            }
            let passed = true
            EventPub.Subscribe("demo.path.no",({value})=>{
                passed = false
            })
            EventPub.Subscribe("demo.path.test.no",({value})=>{
                passed = false
            })
            EventPub.Subscribe("demos",({value})=>{
                passed = false
            })
            Object.keys(result).forEach(p => {
                EventPub.Subscribe(p,({value})=>{
                    result[p] = true
                })
            });            
            EventPub.Publish("demo.path.test",{
                value:true
            })
            Object.keys(result).forEach(p => {
                if(result[p]===false)
                    done("No passed "+p)
            }); 
            done(passed?null:"Fail in no valid path")
        });
        it('Event subscribe', (done) => {
            EventPub.On("subscribe",()=>{
                done()
            })            
            EventPub.Subscribe("demo.path.no",({value})=>{                
            })
        });
        it('Event unsubscribe', (done) => {
            EventPub.On("unsubscribe",()=>{
                done()
            })            
            const k = EventPub.Subscribe("demo.path.no",({value})=>{                
            })
            EventPub.Unsubscribe("demo.path.no",k)
        });
        it('Event with no exist unsubscribe', (done) => {
            EventPub.On("unsubscribe",()=>{
                done("Fail on unsubscribe")
            })            
            const k = EventPub.Subscribe("demo.path.no",({value})=>{                
            })
            EventPub.Unsubscribe("demo.path",k)
            done()
        });
    });
    describe('Server side', () => {
        it('Subscribe', (done) => {
            EventPub.Subscribe("demo.path",({value})=>{},null,_netIdOne)
            done()
        });
        it('Subscribe with own key', (done) => {
            const k = EventPub.Subscribe("demo.path",({value})=>{                
            },"DemoSubKey",_netIdOne)
            done(assert.equal(k,"DemoSubKey"))
        });
        it('Subscribe and publish', (done) => {
            const demoEvent={
                eventId:"DemoEventId", 
                eventDate:3, 
                source:_netIdTwo
            }
            EventPub.Subscribe("demo.path",({value},path,eventId,eventDate,source)=>{
                const recivedEvent={
                    eventId, 
                    eventDate, 
                    source
                }
                Object.keys(demoEvent).forEach(k=>{
                    if(recivedEvent[k]!==demoEvent[k])
                        done("Fail event properties assert")                    
                })
                done()
            },null,_netIdOne)
            EventPub.Publish("demo.path.yes",{
                value:true
            },demoEvent.eventId,demoEvent.eventDate,demoEvent.source)
        });
        it('Should no send dooble publish to same reciver', (done) => {
            const demoEvent={
                eventId:"DemoEventId", 
                eventDate:3, 
                source:_netIdTwo
            }
            const handler = (short)=>{
                done()
            }
            EventPub.Subscribe("demo.path",handler,null,_netIdOne)
            EventPub.Subscribe("demo.path.yes",handler,null,_netIdOne)
            EventPub.Publish("demo.path.yes",{
                value:true
            },demoEvent.eventId,demoEvent.eventDate,demoEvent.source)
        });
        it('Check manager', (done) => {            
            const paths={
                "demo.path":false,
                "demo.path.yes":false
            }
            EventPub.Subscribe("",(value,path)=>{
                paths[path] = true
            },null,_netIdOne)
            EventPub.Publish("demo.path",{
                value:true
            })
            EventPub.Publish("demo.path.yes",{
                value:true
            })
            Object.keys(paths).forEach(p=>{
                if(paths[p]!==true)
                    done(p)
            })
            done()
        });        
    });
});