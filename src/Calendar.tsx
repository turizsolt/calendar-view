import React, {useState} from 'react';

interface State {
}

export interface CalendarProps {
}

const days = [0, 0, 0, 0, 0, 0,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    0, 0, 0, 0, 0, 0];

interface CalendarEvent {
    name: string;
    from: number;
    to: number;
    color: string;
    hash: string;
}

interface CalendarDisplayEvent extends CalendarEvent {
    days: number;
    shift: number;
    before: number;
    margin: number;
    daysBefore: number;
    slice: number;
}

const generateHash = () => {
    let result = '';
    for(let i=0;i<32;i++) {
        const char = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'][Math.random()*16|0];
        result += char;
    }
    return result;
};

const defEvents: CalendarEvent[] = [
    {name: 'Event 1', from: 3, to: 5, color: 'yellow', hash: generateHash()},
    {name: 'Event 2', from: 5, to: 7, color: 'lime', hash: generateHash()},
    {name: 'Event 3', from: 6, to: 7, color: 'moccasin', hash: generateHash()},
    {name: 'Event 4', from: 7, to: 7, color: 'aqua', hash: generateHash()},
    {name: 'Event 5', from: 17, to: 24, color: 'beige', hash: generateHash()},
    {name: 'Event 6', from: 17, to: 20, color: 'gold', hash: generateHash()},
    {name: 'Event 7', from: 20, to: 20, color: 'lightpink', hash: generateHash()},
];

const lastDayRemainder = 1;

const sliceByWeek = (event:CalendarEvent, lastDayRemainder:number) => {
    let slices:CalendarEvent[] = [];
    let startDay: number = event.from;
    for(let i=event.from;i<event.to+1;i++) {
        if(i%7 === lastDayRemainder){
            slices.push({...event, from: startDay, to: i});
            startDay = i+1;
        }
    }
    if(event.to%7 !== lastDayRemainder) {
        slices.push({...event, from: startDay});
    }

    return slices;
};

const getFreeShift = (place:number[][], from:number, to:number) => {
    let i=0;
    for(;;i++) {
        let possible = true;
        for(let j=from;possible && j<to+1;j++) {
            if(place[j][i] !== undefined) {
                possible = false;
            }
        }
        if(possible) {
            return i;
        }
    }
};

const writeShift = (place:number[][], from:number, to:number, shift: number, idx: number) => {
    for(let j=from;j<to+1;j++) {
        place[j][shift] = idx;
    }
};

const getBeforeShift = (place: number[][], from: number, tillShift: number) => {
    if((from+6)%7 === lastDayRemainder) return 0;

    let count = 0;
    for(let i=0;i<tillShift;i++) {
        if(place[from-1][i] !== undefined && place[from][i] === place[from-1][i]) { count++ };
    }
    return count;
};

const order = (events: CalendarEvent[]):CalendarEvent[] => {
    events.sort(
        (a, b) => {
            if(a.from < b.from) return -1;
            if(a.from > b.from) return 1;
            if(a.to < b.to) return 1;
            if(a.to > b.to) return -1;
            return 0;
        }
    );

    return events;
};

const convert = (events: CalendarEvent[]):CalendarDisplayEvent[][] => {
    let result:CalendarDisplayEvent[][] = [];
    let place: number[][] = [];
    for(let i=0;i<32;i++) {
        result.push([]);
        place.push([]);
    }
    events.map((event, idx) => {
        let max=0;
        let slices = sliceByWeek(event, lastDayRemainder);

        let daysBefore = 0;
        let slice = 0;
        slices.map(event => {
            let freeShift = getFreeShift(place, event.from, event.to);
            let before = getBeforeShift(place, event.from, freeShift);
            result[event.from].push({...event, days: event.to-event.from+1, shift: freeShift, before: before, margin: 0,
                daysBefore, slice});
            writeShift(place, event.from, event.to, freeShift, idx);
            daysBefore += event.to-event.from+1;
            slice++;
        });

    });

    for(let i=0;i<32;i++) {
        for(let j=result[i].length-1;j>0;j--) {
            result[i][j].margin = result[i][j].before - result[i][j-1].before;
        }
        if(result[i].length > 0) {
            result[i][0].margin = result[i][0].before;
        }
    }

    return result;
}

//const eventsByDay = convert(events);
/*[
[], [], [],
[{...events[0], days: 3, shift: 0}],
[],
[{...events[1], days: 3, shift: 1}],
[{...events[2], days: 2, shift: 2}],
[{...events[3], days: 1, shift: 0}],
[],[],[],[],[],[],[],[],[],
[{...events[4], days: 6, shift: 0}, {...events[5], days: 4, shift: 1}],
[],[],
[{...events[6], days: 1, shift: 2}],
[],[],
[{...events[4], days: 2, shift: 0}]
,[],[],[],[],[],[],[],[],
];*/

export const Calendar: React.FC<CalendarProps> = (props: CalendarProps) => {

    const [createEvent, setCreateEvent] = useState({from: 0, to: 0, active: '', hash: '', moveStart: -1, moveOn: -1});

    const handleMouseDown = (i:number) => (event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        // if(createEvent.active !== '') return;
        // return;
        console.log('ce', createEvent);

        console.log('down', i);
        setCreateEvent({...createEvent, from: i, to: i, active: 'create'});
    };

    const handleLeftResize = (item:number, hash: string) => (event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log('left resize', item);
        setCreateEvent({...createEvent, active: 'left-resize', from: item, hash});
        console.log('ce1', createEvent);
        event.stopPropagation();
        return true;
    };

    const handleMove = (item:number, hash: string, ev: CalendarDisplayEvent) => (event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log('move', item);
        console.log('cem', createEvent);
        console.log('ev', event);
        let div:HTMLDivElement = event.target as HTMLDivElement;
        div = div.parentElement as HTMLDivElement;
        let test = (event.pageX-div.offsetLeft) / div.offsetWidth;
        const moveStart = ev ? ev.from + (test*ev.days|0) : item;
        console.log('megfog', moveStart,'---' ,ev && (test*ev.days|0), ev.daysBefore);
        setCreateEvent({...createEvent, active: 'move', hash, moveStart, moveOn: moveStart});

        console.log('moveStart', moveStart);
        event.stopPropagation();
        return true;
    };

    const handleDelete = (item:number, hash: string) => (event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log('delete', item);
        setEvents(events.filter(x => x.hash !== hash));
        console.log('ce1', createEvent);
        event.stopPropagation();
        return true;
    };

    const handleMouseUp = (i:number) => (event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log('up', i);
        console.log('ce', createEvent);

        switch(createEvent.active) {
            case 'create':
                setCreateEvent({...createEvent, to: i, active: ''});
                const [from, to] = createEvent.from < i ? [createEvent.from, i] : [i, createEvent.from];
                setEvents([...events, {name: 'Created', from, to, color: `rgb(${Math.random() * 256 | 0},${Math.random() * 256 | 0},${Math.random() * 256 | 0})`, hash: generateHash()}]);
                break;

            case 'left-resize':
                setCreateEvent({...createEvent, active: ''});
                const x = events.findIndex(z => z.hash === createEvent.hash);
                if(x !== undefined) events[x].from = i;
                setEvents([...events]);
                break;

            case 'move':
                setCreateEvent({...createEvent, active: ''});
                const y = events.findIndex(z => z.hash === createEvent.hash);
                if(y !== undefined) events[y].from += (createEvent.moveOn-createEvent.moveStart);
                if(y !== undefined) events[y].to += (createEvent.moveOn-createEvent.moveStart);
                setEvents([...events]);
                break;

            default:
                setCreateEvent({...createEvent, active: ''});
                break;
        }
    };
    const handleMouseEnter = (i:number) => (event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log('enter', i);
        if(createEvent.active === 'left-resize') setCreateEvent({...createEvent, from: i});
        if(createEvent.active === 'create') setCreateEvent({...createEvent, to: i});
        if(createEvent.active === 'move') {setCreateEvent({...createEvent, moveOn: i}); console.log('move', createEvent.moveStart, i);}
    };

    const handleMouseLeave = (i:number) => (event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log('leave', i);
    };

    const handlePreventDefault = (event:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        console.log('prevent');
        event.preventDefault();
        return false;
    };

    const [events, setEvents] = useState<CalendarEvent[]>(defEvents);
    const [from, to] = createEvent.from < createEvent.to ? [createEvent.from, createEvent.to] : [createEvent.to, createEvent.from];
    const ev = createEvent.active === 'create' ? [{name: 'Creating...', from, to, color: 'red', hash: 'creating'}]: [];
    const eventsResized = [...events.map(x => ({...x}))];
    if(createEvent.active === 'left-resize') {
        const x = eventsResized.findIndex(z => z.hash === createEvent.hash);
        if(x !== undefined) eventsResized[x].from = createEvent.from;
    }
    if(createEvent.active === 'move') {
        const y = eventsResized.findIndex(z => z.hash === createEvent.hash);
        const yy = events.findIndex(z => z.hash === createEvent.hash);
        if(y !== undefined) eventsResized[y].from = events[yy].from + (createEvent.moveOn-createEvent.moveStart);
        if(y !== undefined) eventsResized[y].to = events[yy].to + (createEvent.moveOn-createEvent.moveStart);
    }
    const eventsByDay = convert(order([...eventsResized, ...ev]));



    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: '100px'}}>
                { days.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            border: '1px solid black',
                            minHeight: '100px',
                            backgroundColor: item ? 'lightgray' : 'white',
                            paddingBottom: '20px',
                            userSelect: 'none',
                            ...(createEvent.active === '' ? {cursor: 'ew-resize'} : {}),
                        }}
                        onMouseDown={handleMouseDown(item)}
                        onMouseUp={handleMouseUp(item)}
                        onMouseEnter={handleMouseEnter(item)}
                        onMouseLeave={handleMouseLeave(item)}
                    >
                        {item ? item : ''}
                        {eventsByDay[item] && eventsByDay[item].map((ev, idx) => (
                            <div
                                key={`${item}-${idx}`}
                                style={{
                                    backgroundColor: ev.color,
                                    position: 'relative',
                                    zIndex: 2,
                                    border: '1px solid gray',
                                    width: `calc(${ev.days * 100}% + ${ev.days * 2 - 4}px)`,
                                    height: '18px',
                                    marginTop: `${ev.margin * 20}px`,
                                    pointerEvents: createEvent.active ? 'none' : 'auto',
                                    userSelect: 'none',
                                    display: 'flex',
                                }}
                                // onMouseDown={handlePreventDefault}
                                // onMouseUp={handlePreventDefault}
                                // onMouseEnter={handlePreventDefault}
                                // onMouseLeave={handlePreventDefault}
                            >
                                <div onMouseDown={handleLeftResize(item, ev.hash)} style={{ cursor: 'ew-resize' }}>o</div>
                                <div onMouseDown={handleMove(item, ev.hash, ev)} style={{ flexGrow: 1, textAlign: 'center', cursor: 'move' }}>{ev.hash.substring(0,6)}</div>
                                <div onMouseDown={handleDelete(item, ev.hash)} style={{ cursor: 'pointer' }}>X</div>
                                <div style={{ cursor: 'ew-resize' }}>o</div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
};
