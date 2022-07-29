import { Component } from 'react';
import './Checkbox.css';

export default class Checkbox extends Component {
    on_change = (event) => {
        console.dir(event);
        this.props.onChange(event.target.checked);
    }

    render() {
        return (
            <div className='generic-checkbox-wrapper'>
                <input type='checkbox' name={this.props.name} className='generic-checkbox' checked={this.props.value} onChange={this.on_change} />
                <label htmlFor={this.props.name}>{this.props.label}</label>
            </div>
        );
    }
}
