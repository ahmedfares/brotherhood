import React, { Component } from 'react'

import withStyles from '@material-ui/core/styles/withStyles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import Paper from '@material-ui/core/Paper';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Dialog from '@material-ui/core/Dialog';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import Slide from '@material-ui/core/Slide';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CircularProgress from '@material-ui/core/CircularProgress';
import CardContent from '@material-ui/core/CardContent';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogContent from '@material-ui/core/DialogContent';
import { Stack, Animation } from '@devexpress/dx-react-chart';
import {
	Legend,
	ArgumentAxis,
	ValueAxis,
	BarSeries,
} from '@devexpress/dx-react-chart-material-ui';
import { Palette } from '@devexpress/dx-react-chart';
import { EventTracker, HoverState } from '@devexpress/dx-react-chart';

import {
	Chart,
	PieSeries,
	Title,
	Tooltip
} from '@devexpress/dx-react-chart-material-ui';

import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { authMiddleWare } from '../util/auth';
import { blue, green, red } from '@material-ui/core/colors';
import myInitObject from '../util/config';
// import Chart from "react-google-charts";

function createData(name, calories, fat, carbs, protein) {
	return { name, calories, fat, carbs, protein };
}
const rows = [
	{
		name: 'Ahmed',
		calories: 98
	}
];

const styles = (theme) => ({
	content: {
		flexGrow: 1,
		padding: theme.spacing(3),
	},
	toolbar: theme.mixins.toolbar,
	title: {
		marginLeft: theme.spacing(2),
		flex: 1
	},
	submitButton: {
		display: 'block',
		color: 'white',
		textAlign: 'center',
		position: 'absolute',
		top: 14,
		right: 10
	},
	floatingButton: {
		position: 'fixed',
		bottom: 0,
		right: 0
	},
	form: {
		width: '98%',
		marginLeft: 13,
		marginTop: theme.spacing(10)
	},
	toolbar: theme.mixins.toolbar,
	root: {
		minWidth: 470
	},
	bullet: {
		display: 'inline-block',
		margin: '0 2px',
		transform: 'scale(0.8)'
	},
	pos: {
		marginBottom: 12
	},
	uiProgess: {
		position: 'fixed',
		zIndex: '1000',
		height: '31px',
		width: '31px',
		left: '50%',
		top: '35%'
	},
	dialogeStyle: {
		maxWidth: '50%'
	},
	viewRoot: {
		margin: 0,
		padding: theme.spacing(2)
	},
	closeButton: {
		position: 'absolute',
		right: theme.spacing(1),
		top: theme.spacing(1),
		color: theme.palette.grey[500]
	}
});

const Transition = React.forwardRef(function Transition(props, ref) {
	return <Slide direction="up" ref={ref} {...props} />;
});


class Dashboard extends Component {
	constructor(props) {
		super(props);

		this.state = {
			todos: [],
			payments: [],
			currentPayments: [],
			paymentBy: '',
			description: '',
			category: '',
			amount: '',
			categories: [],
			owners: [],
			months: [
				{ Id: 1, Name: 'January' },
				{ Id: 2, Name: 'February' },
				{ Id: 3, Name: 'March' },
				{ Id: 4, Name: 'April' },
				{ Id: 5, Name: 'May' },
				{ Id: 6, Name: 'June' },
				{ Id: 7, Name: 'July' },
				{ Id: 8, Name: 'August' },
				{ Id: 9, Name: 'September' },
				{ Id: 10, Name: 'October' },
				{ Id: 11, Name: 'November' },
				{ Id: 12, Name: 'December' },
				{ Id: 13, Name: 'All' },
			],
			years: [
				{ Value: '2020' },
				{ Value: '2021' },
				{ Value: '2022' },
				{ Value: '2023' },
				{ Value: '2024' },
				{ Value: '2025' },
				{ Value: '2026' },
				{ Value: '2027' },
				{ Value: '2028' },
				{ Value: 'All' }
			],
			title: '',
			body: '',
			todoId: '',
			errors: [],
			open: false,
			uiLoading: true,
			selectedOwner: 0,
			selectedMonth: (new Date()).getMonth() + 1,
			selectedYear: (new Date()).getFullYear(),
			selectedCategory: 0,
			buttonType: '',
			totalPayments: 0,
			viewOpen: false
		};

		this.deleteTodoHandler = this.deleteTodoHandler.bind(this);
		this.handleEditClickOpen = this.handleEditClickOpen.bind(this);
		this.handleViewOpen = this.handleViewOpen.bind(this);

	}

	handleChange = (event) => {
		this.setState({
			[event.target.name]: event.target.value
		});
	};

	handleOwnerSelectChange = (event) => {
		this.setState({ selectedOwner: event.target.value, name: event.target.name });
	};

	handleMonthSelectChange = (event) => {

		let currentPays = this.state.payments.filter(x => x.TransactionDate.substring(0, 4) == this.state.selectedYear && x.TransactionDate.substring(5, 7) == event.target.value);

		this.setState({
			selectedMonth: event.target.value,
			name: event.target.name,
			currentPayments: currentPays
		});

		let total = 0;
		for (let i = 0; i < currentPays.length; i++) {
			total += Number(currentPays[i].Amount);
		}
		this.setState({
			totalPayments: total
		})
	};

	handleYearSelectChange = (event) => {
		let currentPays = this.state.payments.filter(x => x.TransactionDate.substring(0, 4) == event.target.value && x.TransactionDate.substring(5, 7) == this.state.selectedMonth);
		this.setState({
			selectedYear: event.target.value,
			name: event.target.name,
			currentPayments: currentPays
		});

		let total = 0;
		for (let i = 0; i < currentPays.length; i++) {
			total += Number(currentPays[i].Amount);
		}
		this.setState({
			totalPayments: total
		})
	};

	handleCategorySelectChange = (event) => {
		this.setState({ selectedCategory: event.target.value, name: event.target.name });
	};

	componentWillMount = () => {

		authMiddleWare(this.props.history);
		const authToken = localStorage.getItem('AuthToken');
		axios.defaults.headers.common = { Authorization: `${authToken}` };
		axios
			.get(myInitObject.baseUrl + '/payments')
			.then((response) => {
				this.setState({
					payments: response.data,
					uiLoading: false,
					currentPayments: response.data.filter(x => x.TransactionDate.substring(0, 4) == this.state.selectedYear && x.TransactionDate.substring(5, 7) == this.state.selectedMonth)
				});

				let total = 0;
				for (let i = 0; i < this.state.currentPayments.length; i++) {
					total += Number(this.state.currentPayments[i].Amount);
				}
				this.setState({
					totalPayments: total
				})
			})
			.catch((err) => {
				console.log(err);
			});

		axios
			.get(myInitObject.baseUrl + '/owners')
			.then((response) => {
				this.setState({
					owners: response.data,
					uiLoading: false
				});
			})
			.catch((err) => {
				console.log(err);
			});
		axios
			.get(myInitObject.baseUrl + '/collections')
			.then((response) => {
				this.setState({
					categories: response.data,
					uiLoading: false
				});
			})
			.catch((err) => {
				console.log(err);
			});

	};

	deleteTodoHandler(data) {
		authMiddleWare(this.props.history);
		const authToken = localStorage.getItem('AuthToken');
		axios.defaults.headers.common = { Authorization: `${authToken}` };
		let paymentId = data.payment.paymentId;
		axios
			.delete(myInitObject.baseUrl + `/payment/${paymentId}`)
			.then(() => {
				axios
					.get(myInitObject.baseUrl + '/payments')
					.then((response) => {
						this.setState({
							payments: response.data,
							uiLoading: false
						});
					})
					.catch((err) => {
						console.log(err);
					});
			})
			.catch((err) => {
				console.log(err);
			});
	}

	handleEditClickOpen(data) {
		this.setState({
			title: data.todo.title,
			body: data.todo.body,
			todoId: data.todo.todoId,
			buttonType: 'Edit',
			open: true
		});
	}

	handleViewOpen(data) {
		this.setState({
			title: data.todo.title,
			body: data.todo.body,
			viewOpen: true
		});
	}

	renderCategoryOptions() {
		var categorySelect = [...[{ collectionId: 0, collectionName: 'Select a Category' }], ...this.state.categories];
		return categorySelect.map((dt, i) => {
			//console.log(dt);
			return (
				<MenuItem
					label="Select a category"
					value={dt.collectionId}
					key={i} name={dt.collectionName}>{dt.collectionName}</MenuItem>

			);
		});
	}

	renderOwnerOptions() {
		var categorySelect = [...[{ ownerId: 0, ownerName: 'Select Owner' }], ...this.state.owners];
		return categorySelect.map((dt, i) => {
			//console.log(dt);
			return (
				<MenuItem
					label="Select owner"
					value={dt.ownerId}
					key={i} name={dt.ownerName}>{dt.ownerName}</MenuItem>

			);
		});
	}

	renderMonthsOptions() {
		var monthSelect = [...[{ Id: 0, Name: 'Select Month' }], ...this.state.months];
		return monthSelect.map((dt, i) => {
			//console.log(dt);
			return (
				<MenuItem
					label="Select Month"
					value={dt.Id}
					key={i} name={dt.Name}>{dt.Name}</MenuItem>

			);
		});
	}

	renderYearsOptions() {
		var yearSelect = [...[{ Value: 'Select Year' }], ...this.state.years];
		return yearSelect.map((dt, i) => {
			//console.log(dt);
			return (
				<MenuItem
					label="Select year"
					value={dt.Value}
					key={i} name={dt.Value}>{dt.Value}</MenuItem>

			);
		});
	}

	render() {

		const DialogTitle = withStyles(styles)((props) => {
			const { children, classes, onClose, ...other } = props;

			return (
				<MuiDialogTitle disableTypography className={classes.root} {...other}>
					<Typography variant="h6">{children}</Typography>
					{onClose ? (
						<IconButton aria-label="close" className={classes.closeButton} onClick={onClose}>
							<CloseIcon />
						</IconButton>
					) : null}
				</MuiDialogTitle>
			);
		});

		const DialogContent = withStyles((theme) => ({
			viewRoot: {
				padding: theme.spacing(2)
			}
		}))(MuiDialogContent);

		dayjs.extend(relativeTime);
		const { classes } = this.props;
		const { open, errors, viewOpen } = this.state;

		const handleClickOpen = () => {
			this.setState({
				todoId: '',
				title: '',
				body: '',
				buttonType: '',
				open: true
			});
		};

		const handleSubmit = (event) => {
			authMiddleWare(this.props.history);
			event.preventDefault();
			const userTodo = {
				title: this.state.title,
				body: this.state.body
			};
			const userPayment = {
				TransactionBy: this.state.selectedOwner,
				Category: this.state.selectedCategory,
				Description: this.state.description,
				Amount: this.state.amount
			};
			let options = {};
			if (this.state.buttonType === 'Edit') {
				options = {
					url: `/payment/${this.state.todoId}`,
					method: 'put',
					data: userPayment
				};
			} else {
				options = {
					url: '/payment',
					method: 'post',
					data: userPayment
				};
			}
			const authToken = localStorage.getItem('AuthToken');
			axios.defaults.headers.common = { Authorization: `${authToken}` };
			axios(options)
				.then(() => {
					this.setState({ open: false });
					window.location.reload();
				})
				.catch((error) => {
					this.setState({ open: true, errors: error.response.data });
					console.log(error);
				});
		};

		const handleViewClose = () => {
			this.setState({ viewOpen: false });
		};

		const handleClose = (event) => {
			this.setState({ open: false });
		};

		if (this.state.uiLoading === true) {
			return (
				<main className={classes.content}>
					<div className={classes.toolbar} />
					{this.state.uiLoading && <CircularProgress size={150} className={classes.uiProgess} />}
				</main>
			);
		} else {

			const categoryData = [];
			const ownerData = [];


			const chartData = [
				{
					category: 'Rent', payment: 0, expected: 0,
				}, {
					category: 'Charity', payment: 0, expected: 0,
				}, {
					category: 'Electricity', payment: 0, expected: 0,
				}, {
					category: 'Internet', payment: 0, expected: 0,
				}, {
					category: 'Insurance', payment: 0, expected: 0,
				}, {
					category: 'Expenses', payment: 0, expected: 0,
				}, {
					category: 'Fuel', payment: 0, expected: 0,
				}];

			if (this.state.owners.length > 0 && this.state.categories.length > 0 && this.state.currentPayments.length > 0) {
				this.state.currentPayments.map(obj => ({ ...obj, CategoryName: this.state.categories.find(x => x.collectionId == obj.Category).collectionName })).reduce(function (res, value) {
					if (!res[value.CategoryName]) {
						res[value.CategoryName] = { argument: value.CategoryName, value: value.Amount };
						categoryData.push(res[value.CategoryName])
					}
					res[value.CategoryName].Amount = Number(value.Amount) + ((res[value.CategoryName].Amount) ? Number(res[value.CategoryName].Amount) : 0);
					res[value.CategoryName].value = res[value.CategoryName].Amount;
					return res;
				}, {});

				this.state.currentPayments.map(obj => ({ ...obj, CategoryName: this.state.categories.find(x => x.collectionId == obj.Category).collectionName, CategoryAmount: this.state.categories.find(x => x.collectionId == obj.Category).Amount })).reduce(function (res, value) {
					if (!res[value.CategoryName]) {
						res[value.CategoryName] = {
							category: value.CategoryName,
							payment: value.Amount,
							expected: Number(value.CategoryAmount)
						};
						chartData.push(res[value.CategoryName])
					}
					res[value.CategoryName].Amount = Number(value.Amount) + ((res[value.CategoryName].Amount) ? Number(res[value.CategoryName].Amount) : 0);
					res[value.CategoryName].payment = res[value.CategoryName].Amount;
					return res;
				}, {});

				this.state.currentPayments.map(obj => ({ ...obj, OwnerName: this.state.owners.find(x => x.ownerId == obj.TransactionBy).ownerName, OwnerAmount: this.state.owners.find(x => x.ownerId == obj.TransactionBy).Amount })).reduce(function (res, value) {
					if (!res[value.OwnerName]) {
						res[value.OwnerName] = { argument: value.OwnerName, value: value.Amount, expected: Number(value.OwnerAmount) };
						ownerData.push(res[value.OwnerName])
					}
					res[value.OwnerName].Amount = Number(value.Amount) + ((res[value.OwnerName].Amount) ? Number(res[value.OwnerName].Amount) : 0);
					res[value.OwnerName].value = res[value.OwnerName].Amount;
					return res;
				}, {});

			}

			let header = "Payments Vs Expected payments in "+this.state.selectedMonth + "-" + this.state.selectedYear+" Total Payments : " + this.state.totalPayments;

			return (
				<main style={{ width: 1200, padding: 24 }}>
					<div className={classes.toolbar} />

					<div className="row" style={{ margin: 10 }}>
						<div className={`col-xs-3 col-md-3`}>
							<Select
								variant="outlined"
								required
								fullWidth
								id="paymentBy"
								label="paymentBy"
								name="paymentBy"
								autoComplete="paymentBy"
								helperText={errors.paymentBy}
								value={this.state.selectedMonth}
								onChange={this.handleMonthSelectChange}>
								{this.renderMonthsOptions()}
							</Select>
						</div>
						<div className={`col-xs-3 col-md-3`}>
							<Select
								variant="outlined"
								required
								fullWidth
								id="paymentBy"
								label="paymentBy"
								name="paymentBy"
								autoComplete="paymentBy"
								helperText={errors.paymentBy}
								value={this.state.selectedYear}
								onChange={this.handleYearSelectChange}>
								{this.renderYearsOptions()}
							</Select>
						</div>

					</div>
					<TableContainer component={Paper} style={{ marginBottom: 20 }}>
						<Table sx={{ minWidth: 650 }} aria-label="a dense table">
							<TableBody>
								<TableRow >
									<TableCell>
										<Paper>
											<Chart
												data={chartData}
											>
												<ArgumentAxis />
												<ValueAxis
													max={2400}
												/>

												<BarSeries
													name="Payment"
													valueField="payment"
													argumentField="category"
												/>
												<BarSeries
													name="Expected"
													valueField="expected"
													argumentField="category"
												/>
												<Animation />
												<Legend />
												<EventTracker />
												<Tooltip />
												<HoverState />
												<Title text={header} />
												<Stack
												/>
											</Chart>
										</Paper>
									</TableCell>
								</TableRow>

							</TableBody>
						</Table>
					</TableContainer>

					<TableContainer component={Paper} style={{ marginBottom: 20 }}>
						<Table sx={{ minWidth: 650 }} aria-label="a dense table">
							<TableBody>
								<TableRow >
									<TableCell>
										<Chart
											data={categoryData}
											height={400}
											width={400}
											options={{
												legend: { visible: true, position: "right" }
											}}
										>
											<PieSeries valueField="value" argumentField="argument" />
											<Title text="Payments per category" />
											<Animation />
											<Legend />
											<EventTracker />
											<Tooltip />
											<HoverState />
										</Chart>
									</TableCell>
									<TableCell>
										<Chart
											data={ownerData}
											height={400}
											width={400}
											options={{
												legend: { visible: true, position: "right" }
											}}
										>
											<PieSeries valueField="value" argumentField="argument" />
											<Title text="Payments per Action Taker" />
											<Animation />
											<Legend />
											<EventTracker />
											<Tooltip />
											<HoverState />
										</Chart>
									</TableCell>
								</TableRow>

							</TableBody>
						</Table>
					</TableContainer>

					<TableContainer component={Paper} style={{ marginBottom: 20 }}>
						<Table sx={{ minWidth: 650 }} aria-label="a dense table">
							<TableBody>
								<TableRow >
									<TableCell>
										<Paper>
											<Chart
												data={ownerData}
											>
												<ArgumentAxis />
												<ValueAxis
													max={2400}
												/>

												<BarSeries
													name="value"
													valueField="value"
													argumentField="argument"
												/>
												<BarSeries
													name="Expected"
													valueField="expected"
													argumentField="argument"
												/>
												<Animation />
												<Legend />
												<EventTracker />
												<Tooltip />
												<HoverState />
												<Title text="Payments Vs Expected payments in Oct 2021" />
												<Stack
												/>
											</Chart>
										</Paper>
									</TableCell>
								</TableRow>

							</TableBody>
						</Table>
					</TableContainer>

					<Dialog
						onClose={handleViewClose}
						aria-labelledby="customized-dialog-title"
						open={viewOpen}
						fullWidth
						classes={{ paperFullWidth: classes.dialogeStyle }}
					>
						<DialogTitle id="customized-dialog-title" onClose={handleViewClose}>
							{this.state.title}
						</DialogTitle>
						<DialogContent dividers>
							<TextField
								fullWidth
								id="todoDetails"
								name="body"
								multiline
								readonly
								rows={1}
								rowsMax={25}
								value={this.state.body}
								InputProps={{
									disableUnderline: true
								}}
							/>
						</DialogContent>
					</Dialog>
				</main>
			);
		}
	}
}

export default (withStyles(styles)(Dashboard));
