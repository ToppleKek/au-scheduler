import { Component, createContext } from 'react';
import * as Constants from '../constants';
import * as Components from '../components';
import Button from '../components/Button';
import './status.css';

const PopupInteractionContext = createContext({callback: null});

export class Popup extends Component {
    constructor(props) {
        super(props);

        const obj = {};
        let children = props.children.props.children;

        if ((typeof children) === 'object')
            children = [children];

        children.forEach((child) => {
            console.log('iterating child:', {key_name:child.props?.key_name,value:child.props?.value});
            if (child.props?.key_name)
                obj[child.props.key_name] = child.props?.value;
        });

        this.state = { obj };
    }

    on_button_click = (button) => {
        const button_type = Constants[`POPUP_BUTTON_${button.toUpperCase()}`];

        if (!button_type)
            return;

        console.log('on_button_click:', this.state.obj);
        this.props.onInteract({button: button_type, data: this.state.obj});
    }

    on_dismiss = () => {
        this.props.onInteract('Dismiss');
    }

    prevent_default = (event) => {
        event.stopPropagation();
    }

    on_item_interact = (key_name, value) => {
        console.log(`on_item_interact: key_name=${key_name} value=${value}`);
        this.setState((state) => {
            const copy = { ...state.obj };
            copy[key_name] = value;

            return { obj: copy };
        });
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
                        <PopupInteractionContext.Provider value={{callback:this.on_item_interact}}>
                            {this.props.children}
                        </PopupInteractionContext.Provider>
                    </div>
                    <div className='popup-actions'>
                        {buttons}
                    </div>
                </div>
            </div>
        );
    }
}

export function Header(props) {
    return (
        <div className='popup-sub-header'>
            {props.children}
        </div>
    );
}

export class Checkbox extends Component {
    static contextType = PopupInteractionContext;

    constructor(props) {
        super(props);

        this.state = {
            value: this.props.value
        };
    }

    on_change = (value) => {
        this.context.callback(this.props.key_name, value);
        this.setState({
            value
        });
    }

    render() {
        return (
            <Components.Checkbox
                name={this.props.name}
                label={this.props.label}
                value={this.state.value}
                onChange={this.on_change}
            />
        );
    }
}

export class LineEdit extends Component {
    static contextType = PopupInteractionContext;

    constructor(props) {
        super(props);

        this.state = {
            value: this.props.value
        };
    }

    on_change = (value) => {
        this.context.callback(this.props.key_name, value);
        this.setState({
            value
        });
    }

    render() {
        return (
            <Components.LineEdit onChange={this.on_change} placeholder={this.props.placeholder} value={this.state.value} />
        );
    }
}

export class Selector extends Component {
    static contextType = PopupInteractionContext;

    constructor(props) {
        super(props);

        this.state = {
            value: this.props.value
        };
    }

    on_change = (value) => {
        this.context.callback(this.props.key_name, value);
        this.setState({
            value
        });
    }

    render() {
        return (
            <Components.Selector
                options={this.props.options}
                value={this.state.value}
                onChange={this.on_change}
            />
        );
    }
}
