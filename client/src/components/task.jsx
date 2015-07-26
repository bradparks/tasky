"use strict";

import * as React from "react/addons";
import * as styler from "classnames";
import * as moment from "moment";

import * as hasValue from "../utils/hasValue";

import * as ToggleCheckboxComponent from "./toggle-checkbox";
import * as TaskButtonComponent from "./task-button";
const ToggleCheckbox = React.createFactory(ToggleCheckboxComponent);
const TaskButton = React.createFactory(TaskButtonComponent);

import {KeyboardKeys, Options} from "../constants/AppConstants";

export const Task = React.createClass({
    displayName: "Task",

    interval: null, // eslint-disable-line react/sort-comp

    propTypes: {
        defaultValue: React.PropTypes.string.isRequired,
        index: React.PropTypes.number.isRequired,
        isArchivedMode: React.PropTypes.bool.isRequired,
        isFocus: React.PropTypes.bool.isRequired,
        moveDownHandler: React.PropTypes.func.isRequired,
        moveFocusDownHandler: React.PropTypes.func.isRequired,
        moveFocusUpHandler: React.PropTypes.func.isRequired,
        moveUpHandler: React.PropTypes.func.isRequired,
        newTaskHandler: React.PropTypes.func.isRequired,
        placeholder: React.PropTypes.string,
        removeHandler: React.PropTypes.func.isRequired,
        restoreTaskHandler: React.PropTypes.func,
        saveHandler: React.PropTypes.func.isRequired,
        setFocusHandler: React.PropTypes.func.isRequired,
        task: React.PropTypes.object,
        toggleStateHandler: React.PropTypes.func.isRequired
    },

    getInitialState() {
        let defaultDescription = "";
        if(hasValue(this.props.task)) {
            defaultDescription = this.props.task.description;
        }

        return {
            inputValue: defaultDescription,
            selectContent: true
        };
    },

    componentDidMount(){
        this.componentDidUpdate();
    },

    componentDidUpdate() {
        if(this.props.isFocus) {
            // Starts the periodical save if it's not a creation form
            // and if it's not already started.
            if(hasValue(this.props.task) && !hasValue(this.interval)) {
                this.startPeriodocalSave();
            }

            // Only selects the content when the task is focused (first render).
            if(this.state.selectContent) {
                const node = this.refs["task-content"].getDOMNode();
                node.focus();

                const index = node.value.length;
                node.setSelectionRange(0, index);
                this.setState({selectContent: false});
            }
        }
    },

    componentWillUnmount() {
        this.stopPeriodicalSave();
    },

    createNewTask() {
        // If the task already exist, we want to create an empty one.
        const content =
            hasValue(this.props.task) ? null : this.state.inputValue;

        this.props.newTaskHandler(content);

        // Resets the form field if it's a form.
        if(!hasValue(this.props.task)) {
            this.setState({inputValue: ""});
        }

        // Moves the focus to the newly created task if it's not the form.
        if(hasValue(this.props.task)) {
            this.props.setFocusHandler(this.props.index + 1);
        }
    },

    isNewTaskForm() {
        return hasValue(this.props.placeholder);
    },

    // Handles blur by mouse click.
    onBlur() {
        // Removes the focus.
        if(this.props.isFocus) {
            this.props.setFocusHandler(null);
        }

        // Necessary so the content can be select on next focus.
        this.setState({selectContent: true});

        this.stopPeriodicalSave();
        this.saveDescription();
    },

    // Binds the input value to the component's state.
    onChange() {
        const node = this.refs["task-content"].getDOMNode();
        this.setState({inputValue: node.value});
    },


    // Handles focus by mouse click.
    onFocus() {
        if(!this.props.isFocus) {
            const index = this.props.index || 0;
            this.props.setFocusHandler(index);
        }

        this.startPeriodocalSave();
    },

    // Moves the task (re-ordering) with ctrl+top/bottom arrow keys.
    // Removes the task if it's empty with 'backspace' key.
    // If it's a form, adds the selected tags at the beginning.
    onKeyDown(event) {
        const node = this.refs["task-content"].getDOMNode();
        const key = event.keyCode || event.charCode;
        const ctrlPressed = event.ctrlKey || event.metaKey;
        const comboKeyPressed = event.metaKey || event.ctrlKey || event.altKey;

        // Neutral keys shouldn't add the tags list.
        const neutralKeys = [
            KeyboardKeys.BACKSPACE,
            KeyboardKeys.SPACE,
            KeyboardKeys.TAB,
            KeyboardKeys.ENTER,
            KeyboardKeys.ARROW_TOP,
            KeyboardKeys.ARROW_DOWN,
            KeyboardKeys.ARROW_LEFT,
            KeyboardKeys.ARROW_RIGHT
        ];

        // Sharp key on OSX, Ctrl+V is authorized.
        const authorizedComboKeys = [KeyboardKeys.OSX_SHARP, KeyboardKeys.V];

        // When the user types an empty task, it should add a default value.
        // Some keys combinations should not trigger that, therefore they are
        // prevented.
        const shouldAddDefaultValue = this.isNewTaskForm() &&
            node.value.length === 0 &&
            neutralKeys.indexOf(key) === -1 &&
            (!comboKeyPressed && authorizedComboKeys.indexOf(key) > -1);
        if(shouldAddDefaultValue) {
            this.setState({inputValue: this.props.defaultValue});
        }
        else if(node.value.length === 0 && key === KeyboardKeys.BACKSPACE) {
            event.preventDefault();
            this.props.removeHandler();
        }
        else if(key === KeyboardKeys.ARROW_TOP && ctrlPressed) {
            this.props.moveUpHandler();
        }
        else if(key === KeyboardKeys.ARROW_DOWN && ctrlPressed) {
            this.props.moveDownHandler();
        }
        else if(key === KeyboardKeys.ARROW_TOP) {
            this.props.moveFocusUpHandler();
        }
        else if(key === KeyboardKeys.ARROW_DOWN) {
            this.props.moveFocusDownHandler();
        }
    },

    // Change focus with top/bottom keys.
    // Create new task with 'enter' key.
    onKeyUp(event) {
        const key = event.keyCode || event.charCode;

        if(key === KeyboardKeys.ENTER && !this.props.isArchivedMode) {
            this.createNewTask();
        }
    },


    // DEPRECATED
    onToggle() {
        this.props.toggleStateHandler(!this.props.task.done);
    },

    saveDescription() {
        const ref = this.refs["task-content"];
        if(hasValue(ref)) {
            const node = ref.getDOMNode();
            if(hasValue(this.props.task) &&
               node.value !== this.props.task.description) {
                this.props.saveHandler(node.value);
            }
        }
    },

    // Start a timer that saves the task content every
    // `Options.SAVE_INTERVAL_TIME` ms.
    startPeriodocalSave() {
        if(!hasValue(this.interval)) {
            this.interval = setInterval(() => {
                this.saveDescription();
            }, Options.SAVE_INTERVAL_TIME);
        }
    },

    stopPeriodicalSave() {
        clearInterval(this.interval);
        this.interval = null;
    },


    render() {

        const doesntExist = !hasValue(this.props.task) &&
                            !hasValue(this.props.task.id);
        const wrapperClasses = styler({
            "task": true,
            "done": hasValue(this.props.task) && this.props.task.done,
            "new-task": this.isNewTaskForm(),
            "is-creating": doesntExist
        });

        let taskButtonBlock = null;
        if(this.isNewTaskForm() && doesntExist) {
            taskButtonBlock = (
                <TaskButton
                    disabled={this.state.inputValue.length === 0}
                    icon="plus"
                    onSubmit={this.createNewTask} />
            );
        }
        else if(this.props.isArchivedMode) {
            taskButtonBlock = (
                <TaskButton
                    disabled={this.state.inputValue.length === 0}
                    icon="mail-reply"
                    onSubmit={this.props.restoreTaskHandler} />
            );
        }
        else {
            taskButtonBlock = (
                <ToggleCheckbox
                    id={this.props.index}
                    isChecked={this.props.task.done}
                    onToggle={this.onToggle} />
            );
        }

        let archiveAddendumBlock = null;
        if(this.props.isArchivedMode) {
            let formattedDate = "";
            if(hasValue(this.props.task.completionDate)) {
                const completionDate = moment(this.props.task.completionDate);
                const formatter = t("archived date format");
                formattedDate = completionDate.format(formatter);
            }

            archiveAddendumBlock = (
                <div className="todo-completionDate">
                    `${t("completed headline")} ${formattedDate}`;
                </div>
            );
        }

                /*inputProperties =
                    // For some reason tabIndex should start to 1
                    tabIndex: @props.index + 1
                    ref: "task-content"
                    placeholder: @props.placeholder or ''
                    value: @state.inputValue
                    onChange: @onChange
                    onKeyUp: @onKeyUp
                    onKeyDown: @onKeyDown
                    onFocus: @onFocus
                    onBlur: @onBlur
                */
        return (
            <li className={wrapperClasses}>
                {taskButtonBlock}
                <div className="wrapper">
                    <input
                        onBlur={this.onBlur}
                        onChange={this.onChange}
                        onFocus={this.onFocus}
                        onKeyDown={this.onKeyDown}
                        onKeyUp={this.onKeyUp}
                        placeholder={this.props.placeholder || ""}
                        ref="task-content"
                        tabIndex={this.props.index + 1}
                        value={this.state.value}
                    />
                    {archiveAddendumBlock}
                </div>
            </li>
        );
    }
});