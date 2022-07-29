import { Component } from 'react';
import './LineEdit.css';

export default class LineEdit extends Component {
    value_changed = (event) => {
        this.props.onChange(event.target.value);
    }

    render() {
        return (
            <div className='generic-line-edit'>
                <input type='text' placeholder={this.props.placeholder} value={this.props.value} onChange={this.value_changed} />
            </div>
        );
    }
}
