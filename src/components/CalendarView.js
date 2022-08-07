import { Component } from 'react';
import * as Constants from '../constants';
import * as Util from '../util';
import './style/CalendarView.css';

class CalendarEntry extends Component {
    render() {
        const times = Util.timestr_to_ints(this.props.course.time);
        const start = times.start.toString().padStart(4, '0');
        const end = times.end.toString().padStart(4, '0');
        const days = this.props.course.day.toLowerCase().split(' / ');
        const time_slots = [];

        for (const day of days) {
            time_slots.push(
                <TimeSlot
                    start={start}
                    end={end}
                    day={day}
                    course={this.props.course}
                />
            );
        }

        return time_slots;
    }
}

class TimeSlot extends Component {
    constructor(props) {
        super(props);
        this.state = { hovered: false };
    }

    on_hover = (event) => {
        this.setState((state, props) => {
            return {
                hovered: !state.hovered
            };
        });
    }

    render() {
        const wrapper_style = {
            gridRow: `time-${this.props.start} / time-${this.props.end}`,
            gridColumn: this.props.day,
        };

        const slot_style = {
            backgroundColor: this.props.course.colour
        };

        const tooltip_style = {
            visibility: this.state.hovered ? 'visible' : 'hidden'
        };

        const bgc = Util.parse_colour(this.props.course.colour);
        const text_class = `time-slot-text-${Util.text_colour_from_bg(bgc.r, bgc.g, bgc.b)}`;

        return (
            <div className='time-slot-wrapper' style={wrapper_style}>
                <div className='time-slot-tooltip' style={tooltip_style}>
                    {this.props.course.course_code_full}
                </div>
                <div className='time-slot' style={slot_style} onMouseEnter={this.on_hover} onMouseLeave={this.on_hover}>
                    <span className={text_class}>{this.props.course.course_name}</span>
                    <span className={text_class}>{this.props.course.course_code_full} ({this.props.course.course_type})</span>
                    <span className={text_class}>{this.props.course.instructor} ({this.props.course.location})</span>
                    <span className={text_class}>{this.props.course.time}</span>
                </div>
            </div>
        );
    }
}

export default class CalendarView extends Component {
    render() {
        const day_labels = Constants.DAY_COLUMN_LABELS.map((day) =>
            <div className='calendar-label' style={{gridRow: 'label', gridColumn: day}}>{day.toUpperCase()}</div>
        );

        const time_labels = [];
        const filler_items = [];

        for (let time = 800, b = true; time <= 2200; time += b ? 30 : 70, b = !b) {
            const timestr = time.toString();
            const grid_row = `time-${timestr.padStart(4, '0')}`;

            time_labels.push(
                <div className='calendar-label' style={{gridRow: grid_row, gridColumn: 'label'}}>
                    {timestr.slice(0, timestr.length - 2)}:{timestr.slice(timestr.length - 2)}
                </div>
            );

            for (const day of Constants.DAY_COLUMN_LABELS) {
                filler_items.push(
                    <div className='filler-item' style={{gridRow: grid_row, gridColumn: day}} />
                );
            }
        }

        return (
            <div className='calendar-view'>
                {day_labels}
                {time_labels}
                {filler_items}
                {this.props.schedule.filter((course) => !!course.time).map((course) => {
                    return <CalendarEntry course={course} />;
                })}
            </div>
        );
    }
}
