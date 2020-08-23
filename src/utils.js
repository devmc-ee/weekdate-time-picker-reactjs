import {SERVICE_PRICES, SERVICE_OPTIONS} from "./DATA";
import moment from 'moment-timezone';

export const getPrices = codes => {
	return codes.map(code => {
		if (SERVICE_PRICES[code]) {
			return SERVICE_PRICES[code].discountedPrice > 0 ?
				SERVICE_PRICES[code].discountedPrice :
				SERVICE_PRICES[code].price
		}

		return false
	})

};

export const totalPriceCalc = prices => {
	let sum = 0;
	for (let i in prices) {
		sum += prices[i] ? prices[i] : 0;
	}
	return sum;
};

export const getTotalPrice = codes => {
	const prices = getPrices(codes);
	return totalPriceCalc(prices);
}

export const updatePrices = (service, skipIndex) => {
	//console.log('updatePrices',service)

	let totalServicesPrice = 0;
	let selectedServicesPrices = {};

	if (service && skipIndex) {
		for (let key in service) {
			if (SERVICE_PRICES[service[key]] && key.toString() !== skipIndex.toString()) {
				totalServicesPrice += SERVICE_PRICES[service[key]].price;
				selectedServicesPrices[key] = SERVICE_PRICES[service[key]].price;
			} else {
				selectedServicesPrices[key] = ''
			}
		}

	} else {
		for (let key in service) {
			if (SERVICE_PRICES[service[key]]) {
				totalServicesPrice += SERVICE_PRICES[service[key]].price
				selectedServicesPrices[key] = SERVICE_PRICES[service[key]].price
			} else {
				selectedServicesPrices[key] = ''
			}
		}
	}
	//console.log(selectedServicesPrices)
	return {
		totalServicesPrice: totalServicesPrice,
		selectedServicesPrices: selectedServicesPrices
	}

};

export const getTotalDuration = services => {
	//service: [{serviceBase: string, serviceOption: string}, ...]
	let durations = [];
	if (services && services.length > 0) {
		durations = services.map(service => {
			if (service.serviceOption)
				return SERVICE_OPTIONS[service.serviceBase][service.serviceOption];
			return 0;
		});
		return durations.reduce((accum, current) => accum + current);
	}
	return 0;
};

/**
 * generates time slots array according to the set params
 * @param serviceDuration
 * @param selectedDate
 * @param calendarProps
 * @param unavailableSlots []
 * @returns {[]}
 */
export const getTimeSlots = (selectedDate, unavailableSlots, serviceDuration, calendarProps) => {
	const {workingTime, timeStep} = calendarProps;
	if (!unavailableSlots)
		unavailableSlots = [];

	unavailableSlots = extendUnavailableSlots(unavailableSlots, serviceDuration, timeStep);

	let mStart = moment(getStartTime(selectedDate, calendarProps), 'HH:mm');

	let timeSlots = [];
	const end = moment(workingTime.end, 'HH:mm');
	end.subtract(serviceDuration, 'm');

	while (mStart.isSameOrBefore(end)) {

		if (!unavailableSlots.includes(mStart.format('HH:mm'))) {
			timeSlots.push(mStart.format('HH:mm'));
		}
		mStart.add(timeStep, 'm');
	}
	return timeSlots;
};

/**
 * Add unavailable slots to exclude slots that unavailable, because of the service duration
 * @param unavailableSlots
 * @param serviceDuration
 * @param timeStep
 * @returns {this|Array}
 */
export const extendUnavailableSlots = (unavailableSlots, serviceDuration, timeStep) => {

	if (!unavailableSlots || unavailableSlots.length === 0)
		return [];
	let slotsResult = [];
	const steps = serviceDuration / timeStep;
	let mTime;

	for (let slot of unavailableSlots) {
		mTime = moment(slot, 'HH:mm');
		slotsResult.push(slot);

		for (let i = 0; i < steps; i++) {
			slotsResult.push(mTime.subtract(timeStep, 'm').format('HH:mm'))
		}
	}

	//return distinct values
	return [...new Set(slotsResult)].sort();
}

/**
 *  group timeslots
 * @param timeSlots
 * @param groups
 * @returns {*[]|[]}
 */
export const groupTimeSlots = (timeSlots, groups) => {
	//groups: [{start: string, end: string}, ...]
	if (!groups || groups.length === 0)
		return [timeSlots];

	let groupedTimeSlots = [];
	for (let i = 0; i < groups.length; i++)
		groupedTimeSlots.push([]);
	for (let slot of timeSlots) {

		for (let i in groups) {

			const mStart = moment(groups[i].start, 'HH:mm');
			const mEnd = moment(groups[i].end, 'HH:mm');
			if (moment(slot, 'HH:mm').isBetween(mStart, mEnd, 'HH:mm', '[)'))
				groupedTimeSlots[i].push(slot);
		}
	}

	return groupedTimeSlots;
}
/**
 *
 * @param  selectedDate string|obj moment
 * @param calendarProps CalendarSettings
 * @returns {*}
 */
export const getStartTime = (selectedDate, calendarProps) => {
	const {workingTime, timeStep, todaysFirstTimeOffset, timeZone} = calendarProps;
	const mTodayWorkStart = moment(workingTime.start, 'HH:mm').tz(timeZone);
	const mTodayWorkEnd = moment(workingTime.end, 'HH:mm').subtract(Math.ceil(todaysFirstTimeOffset / 2), 'm').tz(timeZone);
	const mTomorrowWorkStart = moment(workingTime.start, 'HH:mm').tz(timeZone).add(1, 'd');
	let currTime;
	//for testing reasons selectedDate can be a moment obj
	let mSelectedDate = moment.isMoment(selectedDate)
		? selectedDate
		: moment(selectedDate, 'YYYY-MM-DD').tz(timeZone);

	//selected date isToday?
	if (mSelectedDate.isSame(mTodayWorkStart, 'day')) {
		//add current time to moment
		if (!moment.isMoment(selectedDate)) {
			mSelectedDate
				.hour(moment().tz(timeZone).format('H'))
				.minute(moment().tz(timeZone).format('m'))
		}
		//workingTime is before start
		if (mSelectedDate.isSameOrBefore(mTodayWorkStart)) {
			return mTodayWorkStart
				.add(todaysFirstTimeOffset, 'm').format('HH:mm')
		}
		if (mSelectedDate.isAfter(mTodayWorkEnd)) {
			return mTodayWorkEnd.format('HH:mm')
		}


		currTime = parseInt(mSelectedDate.format('m'));


		//make devidable on timeStep
		const rCurrTime = Math.ceil(currTime / timeStep) * timeStep;

		if (rCurrTime < 60) {
			mSelectedDate
				.add(todaysFirstTimeOffset, 'm').minute(rCurrTime);

			return mSelectedDate.format('HH:mm')
		}

		return mSelectedDate
			.add(2 * todaysFirstTimeOffset, 'm').minute(0).format('HH:mm')

	}

	//tomorrow
	if (mSelectedDate.isSame(mTomorrowWorkStart, 'day') && moment().tz(timeZone).isAfter(mTodayWorkEnd)) {
		return mTomorrowWorkStart
			.add(todaysFirstTimeOffset, 'm').format('HH:mm')
	}

	return workingTime.start;
};
