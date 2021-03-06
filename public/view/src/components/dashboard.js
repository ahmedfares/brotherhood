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
			paymentBy: '',
			description: '',
			category: '',
			amount: '',
			categories: [],
			owners: [],
			title: '',
			body: '',
			todoId: '',
			errors: [],
			open: false,
			uiLoading: true,
			selectedOwner: 0,
			selectedCategory: 0,
			buttonType: '',
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
		this.setState({ selectedOwner: event.target.value, name: event.target.name});
	};

	handleCategorySelectChange = (event) => {
		this.setState({ selectedCategory: event.target.value, name: event.target.name});
	};

	componentWillMount = () => {

		authMiddleWare(this.props.history);
		const authToken = localStorage.getItem('AuthToken');
		axios.defaults.headers.common = { Authorization: `${authToken}` };
		axios
			.get('https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payments')
			.then((response) => {
				this.setState({
					payments: response.data,
					uiLoading: false
				});
			})
			.catch((err) => {
				console.log(err);
			});

		axios
			.get('https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/owners')
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
			.get('https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/collections')
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
			.delete(`https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payment/${paymentId}`)
			.then(() => {
				axios
					.get('https://us-central1-brotherhood-edc8d.cloudfunctions.net/api/payments')
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
		var categorySelect = [...[{collectionId:0,collectionName:'Select a Category'}], ...this.state.categories];
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
		var categorySelect = [...[{ownerId:0,ownerName:'Select Owner'}], ...this.state.owners];
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
				  category: 'Rent', payment: 0, expected: 1200,
				}, {
					category: 'Charity', payment: 0, expected: 1200,
				}, {
					category: 'Electricity', payment: 0, expected: 100,
				}, {
					category: 'Internet', payment: 0, expected: 40,
				}, {
					category: 'Insurance', payment: 0, expected: 75,
				}, {
					category: 'Expenses', payment: 0, expected: 285,
				}, {
					category: 'Fuel', payment: 0, expected: 100,
				}];

			
			if(this.state.owners.length > 0 && this.state.categories.length > 0 && this.state.payments.length > 0)
			{
				this.state.payments.map(obj=>({ ...obj, CategoryName: this.state.categories.find(x => x.collectionId == obj.Category).collectionName })).reduce(function(res, value) {
					if (!res[value.CategoryName]) {
					  res[value.CategoryName] = { argument: value.CategoryName, value: value.Amount };
					  categoryData.push(res[value.CategoryName])
					}
					res[value.CategoryName].Amount = Number(value.Amount) + ((res[value.CategoryName].Amount)?Number(res[value.CategoryName].Amount):0);
					res[value.CategoryName].value = res[value.CategoryName].Amount;
					return res;
				  }, {});

				this.state.payments.map(obj=>({ ...obj, CategoryName: this.state.categories.find(x => x.collectionId == obj.Category).collectionName })).reduce(function(res, value) {
					if (!res[value.CategoryName]) {
					  res[value.CategoryName] = { category: value.CategoryName, payment: value.Amount,expected: 
					(value.CategoryName == 'Rent')?1200:(value.CategoryName == 'Charity')?1200:(value.CategoryName == 'Food')?500:
					(value.CategoryName == 'Electricity')?100:(value.CategoryName == 'Internet')?40:(value.CategoryName == 'Insurance')?75:
					(value.CategoryName == 'Expenses')?285:(value.CategoryName == 'Fuel')?100:0
					};
					  chartData.push(res[value.CategoryName])
					}
					res[value.CategoryName].Amount = Number(value.Amount) + ((res[value.CategoryName].Amount)?Number(res[value.CategoryName].Amount):0);
					res[value.CategoryName].payment = res[value.CategoryName].Amount;
					return res;
				  }, {});
	
				this.state.payments.map(obj=>({ ...obj, OwnerName: this.state.owners.find(x => x.ownerId == obj.TransactionBy).ownerName})).reduce(function(res, value) {
					  if (!res[value.OwnerName]) {
						res[value.OwnerName] = { argument: value.OwnerName, value: value.Amount };
						ownerData.push(res[value.OwnerName])
					  }
					  res[value.OwnerName].Amount = Number(value.Amount) + ((res[value.OwnerName].Amount)?Number(res[value.OwnerName].Amount):0);
					  res[value.OwnerName].value = res[value.OwnerName].Amount;
					  return res;
					}, {});
	
			}
			
			const expectedData = [
				{ argument:'Food', value:500 },
				{ argument:'Rent', value:1200 },
				{ argument:'Electricity', value:100 },
				{ argument:'Internet', value:40 },
				{ argument:'Charity', value:1200 },
				{ argument:'Fuel', value:100 },
				{ argument:'Insurance', value:75 },
				{ argument:'Expenses', value:285 },
			  ];
			return (
				<main style={{width:1200, padding:24}}>
					<div className={classes.toolbar} />

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
