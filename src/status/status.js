import { Component } from 'react';
import * as Constants from '../constants';
import Button from '../components/Button';
import './status.css';

let popup_callback = null;
let notification_callback = null;

export function register_popup_callback(fn) {
    popup_callback = fn;
}

export function register_notification_callback(fn) {
    notification_callback = fn;
}

export function popup(buttons, header, message) {
    return popup_callback(buttons, header, message);
}

export function notify(type, message) {
    return notification_callback(type, message);
}

export class Popup extends Component {
    on_button_click = (button) => {
        const button_type = Constants[`POPUP_BUTTON_${button.toUpperCase()}`];

        if (!button_type)
            return;

        this.props.onInteract(button_type);
    }

    on_dismiss = () => {
        this.props.onInteract('Dismiss');
    }

    prevent_default = (event) => {
        event.stopPropagation();
        event.preventDefault();
    }

    render() {
        const buttons = this.props.buttons.map((button) =>
            <Button
                role={Constants.POPUP_BUTTONS_POSITIVE.includes(button) ? 'positive' : 'negative'}
                value={button}
                onClick={this.on_button_click}
            />
        );

        return (
            <div className='popup-wrapper' onClick={this.on_dismiss}>
                <div className='popup' onClick={this.prevent_default}>
                    <div className='popup-header'>
                        {this.props.header}
                    </div>
                    <div className='popup-message'>
                        {this.props.message}
                    </div>
                    <div className='popup-actions'>
                        {buttons}
                    </div>
                </div>
            </div>
        );
    }
}
