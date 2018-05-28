import os

path =  os.getcwd()
filenames = os.listdir(path)

for filename in filenames:
	if 'svg' in filename:
		tmp = filename.split('-')
		os.rename(filename, '-'.join(tmp[1:]))