import { Component } from 'react';
import './style/InlineButton.css';

export default class InlineButton extends Component {
    clicked = (event) => {
        event.stopPropagation();
        event.preventDefault();
        this.props.onClick(this.props.value);
    }

    render() {
        return (
            <span className='inline-button' onClick={this.clicked}>
                {this.props.value}
            </span>
        );
    }
}
