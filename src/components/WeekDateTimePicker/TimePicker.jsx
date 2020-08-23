import React from 'react';
import {useFormikContext} from "formik";
import {CALENDAR_SETTINGS} from '../../DATA';
import {Accordion, AccordionDetails, AccordionSummary, Button} from '@material-ui/core';
import {ExpandMore} from "@material-ui/icons";
import moment from 'moment';

const TimePicker = ({selectedDate, expanded, setExpanded, groupedTimeSlots}) => {

	const mSelectedDate = moment(selectedDate);
	mSelectedDate.locale(CALENDAR_SETTINGS.locale);
	const context = useFormikContext();

	const time = context.values.appointment ? context.values.appointment.time : '';

	const handleClick = slot => () => {
		const appointment = {
			appointment: {
				date: selectedDate,
				time: slot
			}
		};
		context.setValues({...context.values, ...appointment})
	};

	const availableTimeSlots = timeSlots => {
		return (
			timeSlots.map(slot => (

					<Button
						variant={(slot === time) ? 'contained' : 'text'} color={(slot === time) ? 'primary' : 'default'}
						value={slot} key={slot} onClick={handleClick(slot)}>
						{slot}
					</Button>

				)
			)
		)

	};
	const handleExpand = (panel) => (event, newExpanded) => {
		setExpanded(newExpanded ? panel : false)
	};
	return (
		<>

			{groupedTimeSlots.map((group, i) => (
				<Accordion
					key={i}
					className="calendar-accordion-item"
					expanded={expanded === `panel${i}` && group.length > 0}
					onChange={handleExpand(`panel${i}`)}
					disabled={group.length <= 0}>

					<AccordionSummary
						expandIcon={<ExpandMore/>} aria-controls="panel1a-content" id="panel1a-header">

						{CALENDAR_SETTINGS.timeSlotGroups[i].start} - {CALENDAR_SETTINGS.timeSlotGroups[i].end}
						<span className="calendar-accordion-label-availability">{group.length} available</span>

					</AccordionSummary>

					<AccordionDetails>

						<div className="calendar-timeslots-container">
							{availableTimeSlots(group)}
						</div>
					</AccordionDetails>

				</Accordion>
			))}

		</>
	)
};

export default TimePicker;
