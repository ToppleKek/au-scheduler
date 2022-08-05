import { Component } from 'react';
import * as Util from '../util';
import './style/Scheduler.css';

class CalendarPreview extends Component {
    on_schedule = (event) => {
        this.props.onSchedule(this.props.schedule);
    }

    render() {
        const num_async = this.props.schedule.filter((course) => !!!course.time).length;
        return (
            <div key={`preview-${this.props.id}`} className='calendar-preview' onClick={this.on_schedule}>
                <div className='calendar-preview-slots'>
                    {this.props.schedule.filter((course) => !!course.time).map((course) => {
                        const times = Util.timestr_to_ints(course.time);
                        return <PreviewTimeSlot
                            key={course.course_code_full + course.day}
                            id={course.course_code_full + this.props.id}
                            start_time={times.start}
                            end_time={times.end}
                            days={course.day}
                            colour={this.props.courses[course.course_code].colour}
                        />;
                    })}
                </div>
                <div className='calendar-preview-footer'>
                    {num_async === 0 ? 'All classes in person' : `Including ${num_async} asynchronous classes`}
                </div>
            </div>
        );
    }
}

class PreviewTimeSlot extends Component {
    render() {
        const start = new String(this.props.start_time).padStart(4, '0');
        const end = new String(this.props.end_time).padStart(4, '0');
        const days = this.props.days.toLowerCase().split(' / ');
        const time_slots = [];

        let i = 0;
        for (const day of days) {
            const style = {
                gridRow: `time-${start} / time-${end}`,
                gridColumn: day,
                backgroundColor: this.props.colour
            };

            time_slots.push(
                <div
                    key={`ts-${++i}-${this.props.id}`}
                    className='preview-time-slot'
                    style={style}
                />
            );
        }

        return time_slots;
    }
}

export default class Scheduler extends Component {
    render() {
        let schedules = Util.schedule(this.props.courses);

        if (this.props.filter.online)
            schedules = schedules.filter((schedule) => !schedule.some((course) => course.online));

        schedules = Util.sort_schedules(this.props.mode, schedules);

        let i = 0;
        const human_schedules = schedules.map((schedule) => (
            <CalendarPreview
                key={`schedule${i}`}
                id={`schedule${++i}`}
                schedule={schedule}
                courses={this.props.courses}
                onSchedule={this.props.onSchedule}
            />
        ));

        return (
            <div className='scheduler'>
                {human_schedules.length === 0 ? 'No schedules could be created with the given courses and filters.' : human_schedules}
            </div>
        );
    }
}
