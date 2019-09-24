import moment, { Moment } from 'moment';
import React from 'react';

export interface Calendar {
    color: string;
    title: string;
    from: Moment;
    to: Moment;
    type: string;
    segment: string;
    tags: string[];
}

export interface CalendarProps {
    startDay: Moment;
    events: Calendar[];
}

interface CalendarEvent {
    name: string;
    from: Moment;
    to: Moment;
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
    for (let i = 0; i < 32; i += 1) {
        const char = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'][Math.floor(Math.random() * 16)];
        result += char;
    }
    return result;
};

const sliceByWeek = (event:CalendarEvent, firstDayOfView: Moment, lastDayOfView: Moment):(CalendarEvent[]|null) => {
    if (event.from.isAfter(lastDayOfView) || event.to.isBefore(firstDayOfView)) return null;

    const slices:CalendarEvent[] = [];

    let firstDay = event.from.clone();
    if (firstDay.isBefore(firstDayOfView)) firstDay = firstDayOfView.clone();

    let lastDay = event.to.clone();
    if (lastDay.isAfter(lastDayOfView)) lastDay = lastDayOfView.clone();

    let startDay = firstDay.clone();
    let i = firstDay.clone();
    for (; i.isSameOrBefore(lastDay); i = i.clone().add(1, 'day')) {
        if (i.weekday() === 6) {
            slices.push({ ...event, from: startDay.clone(), to: i.clone() });
            startDay = i.clone().add(1, 'day');
        }
    }

    if (event.to.weekday() !== 6 && i.isSameOrBefore(lastDayOfView)) {
        slices.push({ ...event, from: startDay.clone() });
    }

    return slices;
};

const toIdx = (mom: Moment):number => parseInt(mom.format('YYYYMMDD'), 10);
const toIdy = (mom: Moment, diff: number):number => parseInt(mom.clone().add(diff, 'days').format('YYYYMMDD'), 10);

const getFreeShift = (place:number[][], from:Moment, to:Moment) => {
    let i = 0;
    for (;; i += 1) {
        let possible = true;
        for (let j = from.clone(); possible && j.isSameOrBefore(to); j = j.add(1, 'day').clone()) {
            if (place[toIdx(j)][i] !== undefined) {
                possible = false;
            }
        }
        if (possible) {
            return i;
        }
    }
};

const writeShift = (place:number[][], from:Moment, to:Moment, shift: number, idx: number) => {
    for (let j = from.clone(); j.isSameOrBefore(to); j = j.add(1, 'day').clone()) {
        place[toIdx(j)][shift] = idx;
    }
};

const getBeforeShift = (place: number[][], from: Moment, tillShift: number) => {
    if (from.weekday() === 6) return 0;

    let count = 0;
    for (let i = 0; i < tillShift; i += 1) {
        if (place[toIdy(from, -1)][i] !== undefined && place[toIdx(from)][i] === place[toIdy(from, -1)][i]) { count += 1; }
    }
    return count;
};

const order = (events: CalendarEvent[]):CalendarEvent[] => {
    events.sort(
        (a, b) => {
            if (a.from.isBefore(b.from)) return -1;
            if (a.from.isAfter(b.from)) return 1;
            if (a.to.isBefore(b.to)) return 1;
            if (a.to.isAfter(b.to)) return -1;
            return 0;
        },
    );

    return events;
};

const convert = (events: CalendarEvent[], firstDayOfView: Moment, lastDayOfView: Moment):CalendarDisplayEvent[][] => {
    const result:CalendarDisplayEvent[][] = [];
    const place: number[][] = [];
    for (let i = firstDayOfView.clone(); i.isSameOrBefore(lastDayOfView); i = i.add(1, 'day').clone()) {
        result[toIdx(i)] = [];
        place[toIdx(i)] = [];
    }
    events.map((event, idx) => {
        const slices = sliceByWeek(event, firstDayOfView, lastDayOfView);
        if (!slices) return;

        let daysBefore = 0;
        let slice = 0;
        slices.map((event2) => {
            const freeShift = getFreeShift(place, event2.from, event2.to);
            const before = getBeforeShift(place, event2.from, freeShift);
            result[toIdx(event2.from)].push({ ...event2, before, daysBefore, slice, days: event2.to.diff(event2.from, 'days') + 1, shift: freeShift, margin: 0 });
            writeShift(place, event2.from, event2.to, freeShift, idx);
            daysBefore += event2.to.diff(event2.from, 'days') + 1;
            slice += 1;
        });

    });

    for (let i = firstDayOfView.clone(); i.isSameOrBefore(lastDayOfView); i = i.clone().add(1, 'days')) {
        for (let j = result[toIdx(i)].length - 1; j > 0; j -= 1) {
            result[toIdx(i)][j].margin = result[toIdx(i)][j].before - result[toIdx(i)][j - 1].before;
        }
        if (result[toIdx(i)].length > 0) {
            result[toIdx(i)][0].margin = result[toIdx(i)][0].before;
        }
    }

    return result;
};

export const Calendar: React.FC<CalendarProps> = (props: CalendarProps) => {

    const firstDay = props.startDay.startOf('month').clone().weekday();

    const events:CalendarEvent[] = props.events.map(e => ({ name: e.title, from: e.from, to: e.to, color: e.color, hash: generateHash() }));

    const days:Moment[] = [];
    console.log(firstDay);
    let date = props.startDay.startOf('month').clone().add(-firstDay, 'days').clone();
    console.log(date);
    const daysInMonth = props.startDay.daysInMonth();
    let j = 0;
    for (let i = 0; i < firstDay; i += 1, j += 1) {
        days.push(date.clone());
        date = date.add(1, 'days').clone();
    }
    for (let i = 0; i < daysInMonth; i += 1, j += 1) {
        days.push(date.clone());
        date = date.add(1, 'days').clone();
    }
    for (; j % 7 !== 0; j += 1) {
        days.push(date.clone());
        date = date.add(1, 'days').clone();
    }
    console.log(days);

    console.log('events', events);
    const eventsByDay = convert(order(events), days[0], days[days.length - 1]);
    console.log('eventsByDay', eventsByDay);

    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 14.28%)', borderTop: '1px solid rgba(224, 224, 224, 1)' /*gridTemplateRows: '100px'*/ }}>
                { days.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            color: item.month() === props.startDay.month() ? 'black' : 'lightgray',
                            borderTop: index < 7 ? 'none' : '1px solid rgba(224, 224, 224, 1)',
                            borderRight: item.weekday() === 6 ? 'none' : '1px solid rgba(224, 224, 224, 1)',
                            minHeight: '100px',
                            backgroundColor: item.isSame(moment(), 'day') ? 'lightyellow' : 'white',
                            paddingBottom: '10px',
                            userSelect: 'none',
                            // ...(createEvent.active === '' ? { cursor: 'ew-resize' } : {}),
                        }}
                        // onMouseDown={handleMouseDown(item.date())}
                        // onMouseUp={handleMouseUp(item.date())}
                        // onMouseEnter={handleMouseEnter(item.date())}
                        // onMouseLeave={handleMouseLeave(item.date())}
                    >
                        <div style={{ paddingLeft: '4px', paddingTop: '4px', paddingBottom: '6px' }}>
                            {item.date()} {false && item.format('ddd')}
                        </div>
                        {/*item.month() === props.startDay.month() &&*/ eventsByDay[toIdx(item)] && eventsByDay[toIdx(item)].map((eve, idx) => (
                            <div
                                key={`${item.date()}-${idx}`}
                                style={{
                                    // background: eve.color,
                                    backgroundColor: 'rgba(224, 224, 224, 1)',
                                    position: 'relative',
                                    color: 'black',
                                    zIndex: 2,
                                    // border: '1px solid gray',
                                    width: `calc(${eve.days * 100}% + ${(eve.days - 1) * 1 - 8 - (item.weekday() === 6 ? 1 : 0)}px)`,
                                    height: '24px',
                                    lineHeight: '24px',
                                    marginLeft: '4px',
                                    marginRight: '4px',
                                    marginBottom: '6px',
                                    marginTop: `${eve.margin * 30}px`,
                                    // pointerEvents: createEvent.active ? 'none' : 'auto',
                                    userSelect: 'none',
                                    display: 'flex',
                                }}
                                // onMouseDown={handlePreventDefault}
                                // onMouseUp={handlePreventDefault}
                                // onMouseEnter={handlePreventDefault}
                                // onMouseLeave={handlePreventDefault}
                            >
                                { false /*<div onMouseDown={handleLeftResize(item.date(), eve.hash)} style={{ cursor: 'ew-resize' }}>o</div>
                                <div onMouseDown={handleMove(item.date(), eve.hash, eve)} style={{ flexGrow: 1, textAlign: 'center', cursor: 'move' }}>{eve.hash.substring(0, 6)}</div>
                                <div onMouseDown={handleDelete(item.date(), eve.hash)} style={{ cursor: 'pointer' }}>X</div>
                                <div style={{ cursor: 'ew-resize' }}>o</div>
                                */ }
                                <div style={{ width: '24px', height: '24px' }}>
                                    <div style={{ marginRight: '12px', width: '12px', height: '12px', borderRadius: '6px', margin: '6px', backgroundColor: eve.color }} />
                                </div>
                                <div style={{ flexGrow: 1, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' /*, cursor: 'move'*/ }}>{eve.name}</div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
};
